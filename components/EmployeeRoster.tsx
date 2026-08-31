"use client";

import { useEffect, useState } from "react";
import { teamNames } from "@/lib/employees";
import { getKoreaTodayKey } from "@/utils/dutyGenerator";
import type { Employee, TeamName, WorkerSupport } from "@/types";

type EmployeeRosterProps = {
  employees: Employee[];
  isSharedStorageReady: boolean;
  onEmployeesChange: (employees: Employee[]) => void;
  onResetSettings: () => void;
  onSaveSettings: (employees: Employee[], workerSupport: WorkerSupport) => Promise<void>;
  onWorkerSupportChange: (workerSupport: WorkerSupport) => void;
  startDate: string;
  storageMessage: string;
  workerSupport: WorkerSupport;
};

const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "bread2026";

function createEmployeeId(name: string, team: TeamName) {
  const normalizedName = name.trim().replace(/\s+/g, "-");
  return `${team}-${normalizedName}-${Date.now()}`;
}

export default function EmployeeRoster({
  employees,
  isSharedStorageReady,
  onEmployeesChange,
  onResetSettings,
  onSaveSettings,
  onWorkerSupportChange,
  startDate,
  storageMessage,
  workerSupport
}: EmployeeRosterProps) {
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeam, setNewTeam] = useState<TeamName>("사무행정팀");
  const [effectiveFrom, setEffectiveFrom] = useState(startDate);
  const [workerSupportName, setWorkerSupportName] = useState(workerSupport.name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWorkerSupportName(workerSupport.name);
  }, [workerSupport.name]);

  function unlockAdmin() {
    if (password === adminPassword) {
      setIsAdmin(true);
      setMessage("관리자 모드가 열렸습니다.");
      return;
    }

    setMessage("비밀번호가 맞지 않습니다.");
  }

  async function saveSettings() {
    const nextWorkerSupport = { name: workerSupportName };
    setIsSaving(true);
    setMessage("설정을 저장하는 중입니다.");

    try {
      await onSaveSettings(employees, nextWorkerSupport);
      onWorkerSupportChange(nextWorkerSupport);
      setMessage(
        isSharedStorageReady
          ? "직원 및 근로지원인 설정을 공동 저장했습니다."
          : "Supabase 연결 전이라 이 브라우저에만 저장했습니다."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetSettings() {
    onResetSettings();
    setMessage("설정을 초기화했습니다.");
  }

  function updateEmployees(nextEmployees: Employee[]) {
    onEmployeesChange(nextEmployees);
    setMessage("달력에는 바로 반영됩니다. 다른 사람과 공유하려면 설정 저장을 누르세요.");
  }

  function updateEmployee(employeeId: string, nextFields: Partial<Employee>) {
    updateEmployees(
      employees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              ...nextFields
            }
          : employee
      )
    );
  }

  function moveEmployee(team: TeamName, employeeId: string, direction: -1 | 1) {
    const teamEmployees = employees.filter((employee) => employee.team === team);
    const otherEmployees = employees.filter((employee) => employee.team !== team);
    const currentTeamIndex = teamEmployees.findIndex((employee) => employee.id === employeeId);
    const nextTeamIndex = currentTeamIndex + direction;

    if (currentTeamIndex < 0 || nextTeamIndex < 0 || nextTeamIndex >= teamEmployees.length) {
      return;
    }

    const reorderedTeam = [...teamEmployees];
    const [movedEmployee] = reorderedTeam.splice(currentTeamIndex, 1);
    reorderedTeam.splice(nextTeamIndex, 0, movedEmployee);

    const firstTeamIndex = employees.findIndex((employee) => employee.team === team);
    updateEmployees([
      ...otherEmployees.slice(0, firstTeamIndex),
      ...reorderedTeam,
      ...otherEmployees.slice(firstTeamIndex)
    ]);
  }

  function addEmployee() {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setMessage("추가할 직원 이름을 입력하세요.");
      return;
    }

    const nextEmployee: Employee = {
      id: createEmployeeId(trimmedName, newTeam),
      name: trimmedName,
      team: newTeam,
      status: "active",
      effectiveFrom
    };

    const lastTeamIndex = employees.map((employee) => employee.team).lastIndexOf(newTeam);
    const insertIndex = lastTeamIndex >= 0 ? lastTeamIndex + 1 : employees.length;

    updateEmployees([
      ...employees.slice(0, insertIndex),
      nextEmployee,
      ...employees.slice(insertIndex)
    ]);
    setNewName("");
  }

  function retireEmployee(targetEmployee: Employee) {
    const retiredFrom = targetEmployee.retiredFrom || getKoreaTodayKey();

    updateEmployees(
      employees.map((currentEmployee) =>
        currentEmployee.id === targetEmployee.id
          ? { ...currentEmployee, status: "retired", retiredFrom }
          : currentEmployee
      )
    );
  }

  function restoreEmployee(employeeId: string) {
    updateEmployee(employeeId, { status: "active", retiredFrom: undefined });
  }

  function removeEmployee(employeeId: string) {
    updateEmployees(employees.filter((employee) => employee.id !== employeeId));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-stone-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-950">관리자 설정</h2>
            <p className="mt-1 text-sm text-stone-600">
              직원 추가, 입사일/퇴사일 적용, 순서 변경은 비밀번호 입력 후 사용할 수 있습니다.
            </p>
          </div>
          {!isAdmin ? (
            <div className="grid gap-2 sm:flex sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    unlockAdmin();
                  }
                }}
                placeholder="관리자 비밀번호"
                className="h-10 min-w-0 rounded-md border border-stone-300 px-3 text-sm"
              />
              <button
                type="button"
                onClick={unlockAdmin}
                className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
              >
                관리자 열기
              </button>
            </div>
          ) : (
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSaving}
                className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
              >
                {isSaving ? "저장 중" : "설정 저장"}
              </button>
              <button
                type="button"
                onClick={resetSettings}
                className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                저장 초기화
              </button>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm font-semibold text-stone-600">{storageMessage}</p>
        {message ? <p className="mt-3 text-sm font-semibold text-amber-700">{message}</p> : null}
      </section>

      {!isAdmin ? (
        <section className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <h2 className="text-base font-bold text-stone-950">직원 명단 관리 잠김</h2>
          <p className="mt-2 text-sm text-stone-600">
            직원 순서 변경, 추가, 입사일/퇴사일 적용, 저장 메뉴는 관리자 비밀번호 입력 후 표시됩니다.
          </p>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="rounded-md border border-stone-200 bg-white p-4">
          <h2 className="text-base font-bold text-stone-950">근로지원인 백업 설정</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={workerSupportName}
              onChange={(event) => {
                setWorkerSupportName(event.target.value);
                onWorkerSupportChange({ name: event.target.value });
                setMessage("근로지원인 설정이 아직 저장되지 않았습니다.");
              }}
              placeholder="근로지원인 표시명"
              className="h-10 min-w-0 rounded-md border border-stone-300 px-3 text-sm"
            />
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
            >
              {isSaving ? "저장 중" : "근로지원인 설정 저장"}
            </button>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            입력한 이름은 모든 당번표의 첫 번째 백업 담당으로 표시됩니다.
          </p>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="rounded-md border border-stone-200 bg-white p-4">
          <h2 className="text-base font-bold text-stone-950">직원 추가 / 적용일</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_170px_auto]">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="직원 이름"
              className="h-10 min-w-0 rounded-md border border-stone-300 px-3 text-sm"
            />
            <select
              value={newTeam}
              onChange={(event) => setNewTeam(event.target.value as TeamName)}
              className="h-10 min-w-0 rounded-md border border-stone-300 px-3 text-sm"
            >
              {teamNames.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              className="h-10 min-w-0 rounded-md border border-stone-300 px-3 text-sm"
            />
            <button
              type="button"
              onClick={addEmployee}
              className="h-10 rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"
            >
              직원 추가
            </button>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            입사일 이후 일정부터 당번에 포함됩니다. 직원별 퇴사 버튼은 해당 직원의 퇴사 적용일을 우선 사용하고,
            비어 있으면 오늘 날짜로 적용합니다.
          </p>
        </section>
      ) : null}

      {isAdmin ? <div className="grid gap-4 lg:grid-cols-3">
        {teamNames.map((team) => {
          const teamEmployees = employees.filter((employee) => employee.team === team);

          return (
            <section key={team} className="rounded-md border border-stone-200 bg-white">
              <div className="border-b border-stone-200 px-4 py-3">
                <h2 className="text-base font-bold text-stone-950">{team}</h2>
                <p className="mt-1 text-sm text-stone-600">입사일과 퇴사일을 기준으로 날짜별 당번 포함 여부가 결정됩니다.</p>
              </div>
              <ul className="divide-y divide-stone-100">
                {teamEmployees.map((employee, index) => (
                  <li key={employee.id} className="space-y-3 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-stone-900">{employee.name}</div>
                      <span
                        className={
                          employee.status === "active" && !employee.retiredFrom
                            ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                            : "rounded-md border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500"
                        }
                      >
                        {employee.status === "active" && !employee.retiredFrom ? "근무" : "퇴사 적용"}
                      </span>
                    </div>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      <label className="space-y-1 font-semibold text-stone-600">
                        <span>입사 적용일</span>
                        <input
                          type="date"
                          value={employee.effectiveFrom}
                          onChange={(event) => updateEmployee(employee.id, { effectiveFrom: event.target.value })}
                          className="h-9 w-full rounded-md border border-stone-300 px-2 text-sm font-normal text-stone-900"
                        />
                      </label>
                      <label className="space-y-1 font-semibold text-stone-600">
                        <span>퇴사 적용일</span>
                        <input
                          type="date"
                          value={employee.retiredFrom ?? ""}
                          onChange={(event) =>
                            updateEmployee(employee.id, {
                              retiredFrom: event.target.value || undefined,
                              status: event.target.value ? "retired" : "active"
                            })
                          }
                          className="h-9 w-full rounded-md border border-stone-300 px-2 text-sm font-normal text-stone-900"
                        />
                      </label>
                    </div>
                    <div className="text-xs text-stone-500">
                      순서 {index + 1} · {employee.effectiveFrom}부터 포함
                      {employee.retiredFrom ? ` · ${employee.retiredFrom}부터 제외` : ""}
                    </div>
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                      <div className="grid grid-cols-2 rounded-md border border-stone-200 bg-white p-0.5 sm:flex">
                        <button
                          type="button"
                          onClick={() => moveEmployee(team, employee.id, -1)}
                          disabled={index === 0}
                          className="h-8 rounded px-2 text-xs font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300 hover:bg-stone-100"
                        >
                          위
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEmployee(team, employee.id, 1)}
                          disabled={index === teamEmployees.length - 1}
                          className="h-8 rounded px-2 text-xs font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300 hover:bg-stone-100"
                        >
                          아래
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => retireEmployee(employee)}
                        className="h-9 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        퇴사 적용
                      </button>
                      <button
                        type="button"
                        onClick={() => restoreEmployee(employee.id)}
                        className="h-9 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        퇴사 취소
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEmployee(employee.id)}
                        className="h-9 rounded-md border border-stone-300 bg-white px-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        명단 삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div> : null}
    </div>
  );
}
