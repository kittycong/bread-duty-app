"use client";

import { useMemo, useState } from "react";
import DutyCalendar from "@/components/DutyCalendar";
import DutyTable from "@/components/DutyTable";
import EmployeeRoster from "@/components/EmployeeRoster";
import { defaultWorkerSupport, generateScheduleUntil } from "@/utils/dutyGenerator";
import type { Employee, TeamName, WorkerSupport } from "@/types";

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
type AssignmentOverrides = Record<string, Partial<Record<TeamName, string>>>;
type AssignmentUpdate = {
  date: string;
  member: string;
  team: TeamName;
};
const assignmentOverrideStorageKey = "bread-duty-team-assignment-overrides-v2";
const employeeStorageKey = "bread-duty-employees";
const oldDefaultAdminOrder = ["최수연", "조승민", "노현숙", "김휘원"];
const currentDefaultAdminOrder = ["최수연", "김휘원", "노현숙", "조승민"];

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

export default function ScheduleTabs({ endDate, initialEmployees, startDate }: ScheduleTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("table");
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
      const migratedEmployees = migrateDefaultAdminOrder(parsedEmployees, initialEmployees);

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
  const [workerSupport, setWorkerSupport] = useState<WorkerSupport>(() => {
    if (typeof window === "undefined") {
      return defaultWorkerSupport;
    }

    const savedWorkerSupport = window.localStorage.getItem("bread-duty-worker-support");
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
      const override = assignmentOverrides[assignment.date] ?? {};
      const pickupByTeam = { ...assignment.pickupByTeam };

      assignment.activeTeams.forEach((team) => {
        if (override[team]) {
          pickupByTeam[team] = override[team];
        }
      });

      return {
        ...assignment,
        pickupByTeam,
        pickupMembers: [
          assignment.workerSupportName,
          ...assignment.activeTeams.map((team) => pickupByTeam[team] ?? `${team} 담당자 미지정`)
        ]
      };
    });
  }, [assignmentOverrides, endDate, employeeOrder, startDate, workerSupport]);

  function updateAssignmentMembers(updates: AssignmentUpdate[]) {
    setAssignmentOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides };
      updates.forEach((update) => {
        nextOverrides[update.date] = {
          ...(nextOverrides[update.date] ?? {}),
          [update.team]: update.member
        };
      });
      window.localStorage.setItem(assignmentOverrideStorageKey, JSON.stringify(nextOverrides));
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
        <DutyCalendar assignments={assignments} onAssignmentMembersChange={updateAssignmentMembers} />
      ) : null}
      {activeTab === "employees" ? (
        <EmployeeRoster
          employees={employeeOrder}
          onEmployeesChange={setEmployeeOrder}
          onWorkerSupportChange={setWorkerSupport}
          startDate={startDate}
          workerSupport={workerSupport}
        />
      ) : null}
    </div>
  );
}
