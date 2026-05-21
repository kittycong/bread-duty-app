"use client";

import { useMemo, useState } from "react";
import DutyCalendar from "@/components/DutyCalendar";
import DutyTable from "@/components/DutyTable";
import EmployeeRoster from "@/components/EmployeeRoster";
import { generateScheduleUntil } from "@/utils/dutyGenerator";
import type { Employee } from "@/types";

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

export default function ScheduleTabs({ endDate, initialEmployees, startDate }: ScheduleTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("table");
  const [employeeOrder, setEmployeeOrder] = useState<Employee[]>(() => {
    if (typeof window === "undefined") {
      return initialEmployees;
    }

    const savedEmployees = window.localStorage.getItem("bread-duty-employees");
    if (!savedEmployees) {
      return initialEmployees;
    }

    try {
      return JSON.parse(savedEmployees) as Employee[];
    } catch {
      return initialEmployees;
    }
  });
  const assignments = useMemo(
    () => generateScheduleUntil(startDate, endDate, employeeOrder),
    [endDate, employeeOrder, startDate]
  );

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
      {activeTab === "calendar" ? <DutyCalendar assignments={assignments} /> : null}
      {activeTab === "employees" ? (
        <EmployeeRoster
          employees={employeeOrder}
          onEmployeesChange={setEmployeeOrder}
          startDate={startDate}
        />
      ) : null}
    </div>
  );
}
