import type { DutyAssignment } from "@/types";

type DutyTableProps = {
  assignments: DutyAssignment[];
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
                    {assignment.pickupMembers.map((member) => (
                      <span
                        key={`${assignment.date}-${member}`}
                        className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
                      >
                        {member}
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
