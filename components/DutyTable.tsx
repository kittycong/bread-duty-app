import type { DutyAssignment, TeamName } from "@/types";

type DutyTableProps = {
  assignments: DutyAssignment[];
};

const teamBadgeStyles: Record<TeamName, string> = {
  "사무행정팀": "border-pink-200 bg-pink-50 text-pink-900",
  "활동지원팀": "border-lime-200 bg-lime-50 text-lime-900",
  "복지사업팀": "border-yellow-200 bg-yellow-50 text-yellow-900"
};

export default function DutyTable({ assignments }: DutyTableProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
        생성된 당번표가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <caption className="sr-only">주차별 빵 수령 당번표</caption>
          <thead className="bg-stone-100 text-xs font-semibold uppercase tracking-normal text-stone-600">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3">
                주차
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">
                날짜
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">
                백업팀
              </th>
              <th scope="col" className="px-4 py-3">
                수령 담당
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {assignments.map((assignment) => (
              <tr key={`${assignment.week}-${assignment.date}`} className="hover:bg-stone-50">
                <td className="whitespace-nowrap px-4 py-4 font-medium text-stone-950">
                  {assignment.week}주차
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-stone-700">
                  <div className="font-medium text-stone-900">{assignment.dateLabel}</div>
                  {assignment.holidayName ? (
                    <div className="mt-1 inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                      {assignment.movedFrom} 공휴일({assignment.holidayName})로 목요일 진행
                    </div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-stone-700">
                  {assignment.backupTeam}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-800">
                      {assignment.workerSupportName}
                    </span>
                    {assignment.activeTeams.map((team) => (
                      <span
                        key={`${assignment.date}-${team}`}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${teamBadgeStyles[team]}`}
                        title={team}
                      >
                        {assignment.pickupByTeam[team] ?? `${team} 담당자 미지정`}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
