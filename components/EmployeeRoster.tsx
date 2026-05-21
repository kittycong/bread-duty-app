"use client";

import { useState } from "react";
import { teamNames } from "@/lib/employees";
import type { Employee, TeamName, WorkerSupport } from "@/types";

type EmployeeRosterProps = {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  onWorkerSupportChange: (workerSupport: WorkerSupport) => void;
  startDate: string;
  workerSupport: WorkerSupport;
};

const storageKey = "bread-duty-employees";
const workerSupportStorageKey = "bread-duty-worker-support";
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "bread2026";

function createEmployeeId(name: string, team: TeamName) {
  const normalizedName = name.trim().replace(/\s+/g, "-");
  return `${team}-${normalizedName}-${Date.now()}`;
}

export default function EmployeeRoster({
  employees,
  onEmployeesChange,
  onWorkerSupportChange,
  startDate,
  workerSupport
}: EmployeeRosterProps) {
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeam, setNewTeam] = useState<TeamName>("사무행정팀");
  const [effectiveFrom, setEffectiveFrom] = useState(startDate);
  const [workerSupportName, setWorkerSupportName] = useState(workerSupport.name);

  function unlockAdmin() {
    if (password === adminPassword) {
      setIsAdmin(true);
      setMessage("관리자 모드가 열렸습니다.");
      return;
    }

    setMessage("비밀번호가 맞지 않습니다.");
  }

  function saveSettings() {
    window.localStorage.setItem(storageKey, JSON.stringify(employees));
    window.localStorage.setItem(workerSupportStorageKey, JSON.stringify({ name: workerSupportName }));
    onWorkerSupportChange({ name: workerSupportName });
    setMessage("직원 및 근로지원인 설정을 저장했습니다.");
  }

  function resetSettings() {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(workerSupportStorageKey);
    window.location.reload();
  }

  function updateEmployees(nextEmployees: Employee[]) {
    onEmployeesChange(nextEmployees);
    setMessage("변경사항이 아직 저장되지 않았습니다.");
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

  function retireEmployee(employeeId: string) {
    updateEmployees(
      employees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, status: "retired", retiredFrom: effectiveFrom }
          : employee
      )
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-stone-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-950">관리자 설정</h2>
            <p className="mt-1 text-sm text-stone-600">
              직원 추가, 삭제, 순서 변경은 비밀번호 입력 후 사용할 수 있습니다.
            </p>
          </div>
          {!isAdmin ? (
            <div className="flex flex-col gap-2 sm:flex-row">
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
                className="h-10 rounded-md border border-stone-300 px-3 text-sm"
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveSettings}
                className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
              >
                설정 저장
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
        {message ? <p className="mt-3 text-sm font-semibold text-amber-700">{message}</p> : null}
      </section>

      {!isAdmin ? (
        <section className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <h2 className="text-base font-bold text-stone-950">직원 명단 관리 잠김</h2>
          <p className="mt-2 text-sm text-stone-600">
            직원 순서 변경, 추가, 삭제, 저장 메뉴는 관리자 비밀번호 입력 후 표시됩니다.
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
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
            />
            <button
              type="button"
              onClick={saveSettings}
              className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
            >
              근로지원인 설정 저장
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
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
            />
            <select
              value={newTeam}
              onChange={(event) => setNewTeam(event.target.value as TeamName)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
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
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
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
            추가와 삭제는 선택한 적용일부터 뒤의 날짜에만 반영됩니다.
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
                <p className="mt-1 text-sm text-stone-600">활성 직원만 당번 생성에 포함됩니다.</p>
              </div>
              <ul className="divide-y divide-stone-100">
                {teamEmployees.map((employee, index) => (
                  <li key={employee.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="font-semibold text-stone-900">{employee.name}</div>
                      <div className="mt-1 text-xs text-stone-500">
                        순서 {index + 1} · {employee.effectiveFrom}부터
                        {employee.retiredFrom ? ` · ${employee.retiredFrom}부터 제외` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isAdmin ? (
                        <>
                          <div className="flex rounded-md border border-stone-200 bg-white p-0.5">
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
                            onClick={() => retireEmployee(employee.id)}
                            className="h-8 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </>
                      ) : null}
                      <span
                        className={
                          employee.status === "active"
                            ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                            : "rounded-md border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500"
                        }
                      >
                        {employee.status === "active" ? "근무" : "퇴사"}
                      </span>
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
