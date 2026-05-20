import { employees, teamNames } from "@/lib/employees";

export default function EmployeeRoster() {
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
              {teamEmployees.map((employee) => {
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
        </p>
      </section>
    </div>
  );
}
