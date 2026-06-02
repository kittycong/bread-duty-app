"use client";

import { useEffect, useMemo, useState } from "react";
import DutyCalendar from "@/components/DutyCalendar";
import DutyTable from "@/components/DutyTable";
import EmployeeRoster from "@/components/EmployeeRoster";
import { defaultWorkerSupport, generateScheduleUntil, isEmployeeActiveOnDate } from "@/utils/dutyGenerator";
import type {
  AssignmentDateOverrides,
  AssignmentOverrides,
  Employee,
  SharedDutySettings,
  TeamName,
  WorkerSupport
} from "@/types";

type ScheduleTabsProps = {
  endDate: string;
  initialEmployees: Employee[];
  startDate: string;
};

const tabs = [
  { id: "table", label: "표형" },
  { id: "calendar", label: "달력형" },
  { id: "employees", label: "직원 명단" }
] as const;

type TabId = (typeof tabs)[number]["id"];
type AssignmentUpdate = {
  date: string;
  member: string;
  team: TeamName;
};
type AssignmentDateUpdate = {
  date: string;
  week: number;
};
const assignmentOverrideStorageKey = "bread-duty-team-assignment-overrides-v2";
const assignmentDateOverrideStorageKey = "bread-duty-date-overrides-v1";
const employeeStorageKey = "bread-duty-employees";
const workerSupportStorageKey = "bread-duty-worker-support";
const oldDefaultAdminOrder = ["최수연", "조승민", "노현숙", "김휘원"];
const currentDefaultAdminOrder = ["최수연", "김휘원", "노현숙", "조승민"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function migrateDefaultAdminOrder(savedEmployees: Employee[], initialEmployees: Employee[]) {
  const savedAdminEmployees = savedEmployees.filter((employee) => employee.team === "사무행정팀");
  const savedAdminOrder = savedAdminEmployees.map((employee) => employee.name);

  if (savedAdminOrder.join("|") !== oldDefaultAdminOrder.join("|")) {
    return savedEmployees;
  }

  const defaultAdminByName = new Map(
    initialEmployees
      .filter((employee) => employee.team === "사무행정팀")
      .map((employee) => [employee.name, employee])
  );
  const migratedAdminEmployees = currentDefaultAdminOrder
    .map((name) => defaultAdminByName.get(name))
    .filter((employee): employee is Employee => Boolean(employee));
  const withoutAdminEmployees = savedEmployees.filter((employee) => employee.team !== "사무행정팀");

  return [...migratedAdminEmployees, ...withoutAdminEmployees];
}

function migrateDefaultEmploymentDates(savedEmployees: Employee[], initialEmployees: Employee[]) {
  const initialById = new Map(initialEmployees.map((employee) => [employee.id, employee]));
  const initialByNameAndTeam = new Map(
    initialEmployees.map((employee) => [`${employee.team}|${employee.name}`, employee])
  );

  return savedEmployees.map((employee) => {
    const defaultEmployee =
      initialById.get(employee.id) ?? initialByNameAndTeam.get(`${employee.team}|${employee.name}`);

    if (!defaultEmployee?.retiredFrom || employee.retiredFrom) {
      return employee;
    }

    return {
      ...employee,
      retiredFrom: defaultEmployee.retiredFrom,
      status: "retired" as const
    };
  });
}

function migrateSavedEmployees(savedEmployees: Employee[], initialEmployees: Employee[]) {
  return migrateDefaultEmploymentDates(
    migrateDefaultAdminOrder(savedEmployees, initialEmployees),
    initialEmployees
  );
}

function getDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dateObject = new Date(Date.UTC(year, month - 1, day));
  const weekday = weekdays[dateObject.getUTCDay()];

  return {
    dateLabel: `${date} (${weekday})`,
    day,
    month,
    weekday,
    year
  };
}

function isEligibleOverrideMember(roster: Employee[], team: TeamName, member: string, date: string) {
  return roster.some(
    (employee) =>
      employee.team === team &&
      employee.name === member &&
      isEmployeeActiveOnDate(employee, date)
  );
}

function sanitizeAssignmentOverrides(
  roster: Employee[],
  overrides: AssignmentOverrides,
  dateOverrides: AssignmentDateOverrides,
  startDate: string,
  endDate: string
) {
  const schedule = generateScheduleUntil(startDate, endDate, roster);
  const cleanedOverrides: AssignmentOverrides = {};

  schedule.forEach((assignment) => {
    const assignmentDate = dateOverrides[String(assignment.week)] ?? assignment.date;
    const override = overrides[assignmentDate];

    if (!override) {
      return;
    }

    assignment.activeTeams.forEach((team) => {
      const member = override[team];

      if (member && isEligibleOverrideMember(roster, team, member, assignmentDate)) {
        cleanedOverrides[assignmentDate] = {
          ...(cleanedOverrides[assignmentDate] ?? {}),
          [team]: member
        };
      }
    });
  });

  return cleanedOverrides;
}

function shouldPreserveCurrentAssignments(currentEmployees: Employee[], nextEmployees: Employee[]) {
  const nextById = new Map(nextEmployees.map((employee) => [employee.id, employee]));

  return currentEmployees.some((currentEmployee) => {
    const nextEmployee = nextById.get(currentEmployee.id);

    if (!nextEmployee) {
      return true;
    }

    return (
      Boolean(nextEmployee.retiredFrom) &&
      currentEmployee.retiredFrom !== nextEmployee.retiredFrom
    );
  });
}

function preserveDisplayedAssignments(
  currentAssignments: ReturnType<typeof generateScheduleUntil>,
  currentOverrides: AssignmentOverrides
) {
  const nextOverrides: AssignmentOverrides = { ...currentOverrides };

  currentAssignments.forEach((assignment) => {
    assignment.activeTeams.forEach((team) => {
      const member = assignment.pickupByTeam[team];

      if (!member || member.endsWith("담당자 미지정")) {
        return;
      }

      nextOverrides[assignment.date] = {
        ...(nextOverrides[assignment.date] ?? {}),
        [team]: member
      };
    });
  });

  return nextOverrides;
}

export default function ScheduleTabs({ endDate, initialEmployees, startDate }: ScheduleTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("table");
  const [isSharedStorageReady, setIsSharedStorageReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("공동 저장 설정을 확인하는 중입니다.");
  const [employeeOrder, setEmployeeOrder] = useState<Employee[]>(() => {
    if (typeof window === "undefined") {
      return initialEmployees;
    }

    const savedEmployees = window.localStorage.getItem(employeeStorageKey);
    if (!savedEmployees) {
      return initialEmployees;
    }

    try {
      const parsedEmployees = JSON.parse(savedEmployees) as Employee[];
      const migratedEmployees = migrateSavedEmployees(parsedEmployees, initialEmployees);

      if (migratedEmployees !== parsedEmployees) {
        window.localStorage.setItem(employeeStorageKey, JSON.stringify(migratedEmployees));
      }

      return migratedEmployees;
    } catch {
      return initialEmployees;
    }
  });
  const [assignmentOverrides, setAssignmentOverrides] = useState<AssignmentOverrides>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    window.localStorage.removeItem("bread-duty-assignment-overrides");
    const savedOverrides = window.localStorage.getItem(assignmentOverrideStorageKey);
    if (!savedOverrides) {
      return {};
    }

    try {
      return JSON.parse(savedOverrides) as AssignmentOverrides;
    } catch {
      return {};
    }
  });
  const [assignmentDateOverrides, setAssignmentDateOverrides] = useState<AssignmentDateOverrides>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const savedOverrides = window.localStorage.getItem(assignmentDateOverrideStorageKey);
    if (!savedOverrides) {
      return {};
    }

    try {
      return JSON.parse(savedOverrides) as AssignmentDateOverrides;
    } catch {
      return {};
    }
  });
  const [workerSupport, setWorkerSupport] = useState<WorkerSupport>(() => {
    if (typeof window === "undefined") {
      return defaultWorkerSupport;
    }

    const savedWorkerSupport = window.localStorage.getItem(workerSupportStorageKey);
    if (!savedWorkerSupport) {
      return defaultWorkerSupport;
    }

    try {
      return JSON.parse(savedWorkerSupport) as WorkerSupport;
    } catch {
      return defaultWorkerSupport;
    }
  });
  const assignments = useMemo(() => {
    return generateScheduleUntil(startDate, endDate, employeeOrder, workerSupport).map((assignment) => {
      const dateOverride = assignmentDateOverrides[String(assignment.week)];
      const dateParts = dateOverride ? getDateParts(dateOverride) : undefined;
      const assignmentDate = dateOverride ?? assignment.date;
      const override = assignmentOverrides[assignmentDate] ?? {};
      const pickupByTeam = { ...assignment.pickupByTeam };

      assignment.activeTeams.forEach((team) => {
        const overrideMember = override[team];

        if (overrideMember && isEligibleOverrideMember(employeeOrder, team, overrideMember, assignmentDate)) {
          pickupByTeam[team] = overrideMember;
        }
      });

      return {
        ...assignment,
        ...(dateParts
          ? {
              date: dateOverride,
              dateLabel: dateParts.dateLabel,
              day: dateParts.day,
              holidayName: undefined,
              month: dateParts.month,
              movedFrom: undefined,
              weekday: dateParts.weekday,
              year: dateParts.year
            }
          : {}),
        pickupByTeam,
        pickupMembers: [
          assignment.workerSupportName,
          ...assignment.activeTeams.map((team) => pickupByTeam[team] ?? `${team} 담당자 미지정`)
        ]
      };
    });
  }, [assignmentDateOverrides, assignmentOverrides, endDate, employeeOrder, startDate, workerSupport]);

  function getCurrentSettings(
    nextEmployees = employeeOrder,
    nextWorkerSupport = workerSupport,
    nextAssignmentOverrides = assignmentOverrides,
    nextAssignmentDateOverrides = assignmentDateOverrides
  ): SharedDutySettings {
    return {
      assignmentDateOverrides: nextAssignmentDateOverrides,
      assignmentOverrides: sanitizeAssignmentOverrides(
        nextEmployees,
        nextAssignmentOverrides,
        nextAssignmentDateOverrides,
        startDate,
        endDate
      ),
      employees: nextEmployees,
      workerSupport: nextWorkerSupport
    };
  }

  function saveLocalSettings(settings: SharedDutySettings) {
    window.localStorage.setItem(employeeStorageKey, JSON.stringify(settings.employees));
    window.localStorage.setItem(workerSupportStorageKey, JSON.stringify(settings.workerSupport));
    window.localStorage.setItem(assignmentOverrideStorageKey, JSON.stringify(settings.assignmentOverrides));
    window.localStorage.setItem(
      assignmentDateOverrideStorageKey,
      JSON.stringify(settings.assignmentDateOverrides ?? {})
    );
  }

  async function saveSharedSettings(settings: SharedDutySettings) {
    saveLocalSettings(settings);

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "공동 저장에 실패했습니다.");
    }

    const data = (await response.json()) as { settings: SharedDutySettings; shared: boolean };
    setIsSharedStorageReady(data.shared);
    setStorageMessage(data.shared ? "공동 저장이 연결되었습니다." : "이 브라우저에만 저장됩니다.");
    return data.settings;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSharedSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = (await response.json()) as {
          error?: string;
          settings: SharedDutySettings | null;
          shared: boolean;
        };

        if (!isMounted) {
          return;
        }

        if (!response.ok || !data.shared) {
          setIsSharedStorageReady(false);
          setStorageMessage("Supabase 공동 저장이 아직 연결되지 않아 이 브라우저에만 저장됩니다.");
          return;
        }

        setIsSharedStorageReady(true);
        setStorageMessage("공동 저장이 연결되었습니다.");

        if (data.settings) {
          const migratedEmployees = migrateSavedEmployees(data.settings.employees, initialEmployees);
          setEmployeeOrder(migratedEmployees);
          setWorkerSupport(data.settings.workerSupport);
          setAssignmentOverrides(data.settings.assignmentOverrides ?? {});
          setAssignmentDateOverrides(data.settings.assignmentDateOverrides ?? {});
          saveLocalSettings({ ...data.settings, employees: migratedEmployees });
        }
      } catch {
        if (isMounted) {
          setIsSharedStorageReady(false);
          setStorageMessage("공동 저장을 불러오지 못해 이 브라우저의 저장값을 사용합니다.");
        }
      }
    }

    loadSharedSettings();

    return () => {
      isMounted = false;
    };
  }, [initialEmployees]);

  async function saveRosterSettings(nextEmployees: Employee[], nextWorkerSupport: WorkerSupport) {
    const settings = getCurrentSettings(nextEmployees, nextWorkerSupport);

    if (!isSharedStorageReady) {
      saveLocalSettings(settings);
      setEmployeeOrder(nextEmployees);
      setWorkerSupport(nextWorkerSupport);
      setStorageMessage("Supabase 연결 전이라 이 브라우저에만 저장했습니다.");
      return;
    }

    const savedSettings = await saveSharedSettings(settings);
    setEmployeeOrder(savedSettings.employees);
    setWorkerSupport(savedSettings.workerSupport);
    setAssignmentOverrides(savedSettings.assignmentOverrides ?? {});
    setAssignmentDateOverrides(savedSettings.assignmentDateOverrides ?? {});
  }

  function updateRosterEmployees(nextEmployees: Employee[]) {
    if (shouldPreserveCurrentAssignments(employeeOrder, nextEmployees)) {
      setAssignmentOverrides((currentOverrides) =>
        preserveDisplayedAssignments(assignments, currentOverrides)
      );
    }

    setEmployeeOrder(nextEmployees);
  }

  function resetRosterSettings() {
    window.localStorage.removeItem(employeeStorageKey);
    window.localStorage.removeItem(workerSupportStorageKey);
    window.localStorage.removeItem(assignmentOverrideStorageKey);
    window.localStorage.removeItem(assignmentDateOverrideStorageKey);
    setEmployeeOrder(initialEmployees);
    setWorkerSupport(defaultWorkerSupport);
    setAssignmentOverrides({});
    setAssignmentDateOverrides({});
    setStorageMessage(
      isSharedStorageReady
        ? "이 브라우저 저장값을 초기화했습니다. 공동 저장값을 바꾸려면 설정 저장을 누르세요."
        : "이 브라우저 저장값을 초기화했습니다."
    );
  }

  function updateAssignmentMembers(updates: AssignmentUpdate[]) {
    setAssignmentOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides };
      updates.forEach((update) => {
        nextOverrides[update.date] = {
          ...(nextOverrides[update.date] ?? {}),
          [update.team]: update.member
        };
      });
      const nextSettings = getCurrentSettings(employeeOrder, workerSupport, nextOverrides);
      saveLocalSettings(nextSettings);
      if (isSharedStorageReady) {
        saveSharedSettings(nextSettings).catch(() => {
          setStorageMessage("당번 변경을 공동 저장하지 못했습니다. 이 브라우저에는 저장됐습니다.");
        });
      }
      return nextOverrides;
    });
  }

  function updateAssignmentDates(updates: AssignmentDateUpdate[]) {
    setAssignmentDateOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides };
      updates.forEach((update) => {
        nextOverrides[String(update.week)] = update.date;
      });

      const nextSettings = getCurrentSettings(employeeOrder, workerSupport, assignmentOverrides, nextOverrides);
      saveLocalSettings(nextSettings);
      if (isSharedStorageReady) {
        saveSharedSettings(nextSettings).catch(() => {
          setStorageMessage("일정 날짜 변경을 공동 저장하지 못했습니다. 이 브라우저에는 저장됐습니다.");
        });
      }

      return nextOverrides;
    });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-stone-300 bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "h-9 rounded px-4 text-sm font-semibold bg-stone-900 text-white"
                : "h-9 rounded px-4 text-sm font-semibold text-stone-600 hover:bg-stone-100"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "table" ? <DutyTable assignments={assignments} /> : null}
      {activeTab === "calendar" ? (
        <DutyCalendar
          assignments={assignments}
          employees={employeeOrder}
          onAssignmentDatesChange={updateAssignmentDates}
          onAssignmentMembersChange={updateAssignmentMembers}
        />
      ) : null}
      {activeTab === "employees" ? (
        <EmployeeRoster
          employees={employeeOrder}
          isSharedStorageReady={isSharedStorageReady}
          onEmployeesChange={updateRosterEmployees}
          onResetSettings={resetRosterSettings}
          onSaveSettings={saveRosterSettings}
          onWorkerSupportChange={setWorkerSupport}
          startDate={startDate}
          storageMessage={storageMessage}
          workerSupport={workerSupport}
        />
      ) : null}
    </div>
  );
}
