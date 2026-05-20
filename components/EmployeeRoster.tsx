import { teamNames } from "@/lib/employees";
import type { Employee, TeamName } from "@/types";

type EmployeeRosterProps = {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
};

export default function EmployeeRoster({ employees, onEmployeesChange }: EmployeeRosterProps) {
  function moveEmployee(team: TeamName, employeeId: string, direction: -1 | 1) {
    const teamEmployees = employees.filter((employee) => employee.team === team);
    const currentTeamIndex = teamEmployees.findIndex((employee) => employee.id === employeeId);
    const nextTeamIndex = currentTeamIndex + direction;

    if (currentTeamIndex < 0 || nextTeamIndex < 0 || nextTeamIndex >= teamEmployees.length) {
      return;
    }

    const reorderedTeam = [...teamEmployees];
    const [movedEmployee] = reorderedTeam.splice(currentTeamIndex, 1);
    reorderedTeam.splice(nextTeamIndex, 0, movedEmployee);

    const nextEmployees = employees.flatMap((employee) =>
      employee.team === team ? [] : [employee]
    );
    const insertIndex = employees.findIndex((employee) => employee.team === team);

    onEmployeesChange([
      ...nextEmployees.slice(0, insertIndex),
      ...reorderedTeam,
      ...nextEmployees.slice(insertIndex)
    ]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {teamNames.map((team) => {
        const teamEmployees = employees.filter((employee) => employee.team === team);

        return (
          <section key={team} className="rounded-md border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-base font-bold text-stone-950">{team}</h2>
              <p className="mt-1 text-sm text-stone-600">
                활성 직원만 당번 생성에 포함됩니다.
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {teamEmployees.map((employee, index) => {
                const replacement = employee.replacementFor
                  ? employees.find((candidate) => candidate.id === employee.replacementFor)
                  : undefined;

                return (
                  <li key={employee.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="font-semibold text-stone-900">{employee.name}</div>
                      {replacement ? (
                        <div className="mt-1 text-xs text-stone-500">
                          {replacement.name} 대체 인원
                        </div>
                      ) : null}
                      <div className="mt-1 text-xs text-stone-500">순서 {index + 1}</div>
                    </div>
                    <div className="flex items-center gap-2">
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
                );
              })}
            </ul>
          </section>
        );
      })}
      <section className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 lg:col-span-3">
        <h2 className="text-base font-bold text-stone-950">직원 변경 방법</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          직원 퇴사나 대체 인원 발생 시 <code className="rounded bg-white px-1 py-0.5">lib/employees.ts</code>에서
          해당 직원의 <code className="rounded bg-white px-1 py-0.5">status</code>를 <code className="rounded bg-white px-1 py-0.5">retired</code>로 바꾸고,
          새 직원을 <code className="rounded bg-white px-1 py-0.5">active</code>로 추가하면 다음 일정 생성부터 자동 반영됩니다.
          화면의 순서 변경 버튼은 현재 브라우저에서 즉시 일정표에 반영되는 임시 조정 메뉴입니다.
        </p>
      </section>
    </div>
  );
}
