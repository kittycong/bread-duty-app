import type { DutyAssignment } from "@/types";

type DutyCalendarProps = {
  assignments: DutyAssignment[];
};

const weekHeaders = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthCells(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const cells: Array<number | null> = [];

  for (let i = 0; i < firstDay.getUTCDay(); i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getUTCDate(); day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function DutyCalendar({ assignments }: DutyCalendarProps) {
  const years = [2026, 2027];
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.date, assignment]));

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <section key={year} aria-labelledby={`calendar-${year}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 id={`calendar-${year}`} className="text-xl font-bold text-stone-950">
              {year}년 달력형 당번표
            </h2>
            <p className="text-sm text-stone-600">수요일 기준, 공휴일은 목요일 표시</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;
              const cells = getMonthCells(year, month);

              return (
                <article key={`${year}-${month}`} className="rounded-md border border-stone-200 bg-white">
                  <h3 className="border-b border-stone-200 px-4 py-3 text-base font-semibold text-stone-900">
                    {month}월
                  </h3>
                  <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50 text-center text-xs font-semibold text-stone-500">
                    {weekHeaders.map((header) => (
                      <div key={header} className="py-2">
                        {header}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {cells.map((day, cellIndex) => {
                      const dateKey =
                        day === null
                          ? ""
                          : `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const assignment = assignmentMap.get(dateKey);

                      return (
                        <div
                          key={`${year}-${month}-${cellIndex}`}
                          className="min-h-20 border-b border-r border-stone-100 p-1.5 text-xs last:border-r-0"
                        >
                          {day === null ? null : (
                            <>
                              <div className="font-semibold text-stone-700">{day}</div>
                              {assignment ? (
                                <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-1 text-amber-950">
                                  <div className="font-semibold">{assignment.week}주차</div>
                                  <div className="mt-0.5">{assignment.backupTeam}</div>
                                  <div className="mt-0.5 truncate">{assignment.pickupMembers.join(", ")}</div>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
