"use client";

import { useMemo, useState } from "react";
import type { DutyAssignment, TeamName } from "@/types";

type DutyTableProps = {
  assignments: DutyAssignment[];
};

const teamBadgeStyles: Record<TeamName, string> = {
  "사무행정팀": "border-pink-200 bg-pink-50 text-pink-900",
  "활동지원팀": "border-lime-200 bg-lime-50 text-lime-900",
  "복지사업팀": "border-yellow-200 bg-yellow-50 text-yellow-900"
};

function getAssignmentMembers(assignment: DutyAssignment) {
  return [
    assignment.workerSupportName,
    ...assignment.activeTeams.map((team) => assignment.pickupByTeam[team] ?? "")
  ].filter(Boolean);
}

export default function DutyTable({ assignments }: DutyTableProps) {
  const [searchName, setSearchName] = useState("");
  const employeeNames = useMemo(() => {
    const names = new Set<string>();

    assignments.forEach((assignment) => {
      getAssignmentMembers(assignment).forEach((name) => names.add(name));
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b, "ko"));
  }, [assignments]);
  const filteredAssignments = useMemo(() => {
    const query = searchName.trim();

    if (!query) {
      return assignments;
    }

    return assignments.filter((assignment) =>
      getAssignmentMembers(assignment).some((name) => name.includes(query))
    );
  }, [assignments, searchName]);

  if (assignments.length === 0) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
        생성된 당번표가 없습니다.
      </div>
    );
  }

  return (
    <div className="print-area space-y-3">
      <section className="rounded-md border border-stone-200 bg-white p-4 print:border-0 print:p-0">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="print-hidden space-y-1 text-sm font-semibold text-stone-700">
            <span>개인별 당번 일정 검색</span>
            <input
              type="search"
              list="duty-member-names"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              placeholder="직원 이름 입력"
              className="h-10 w-full rounded-md border border-stone-300 px-3 text-sm font-normal text-stone-900"
            />
            <datalist id="duty-member-names">
              {employeeNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <div className="print-hidden grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setSearchName("")}
              disabled={!searchName}
              className="h-10 whitespace-nowrap rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              검색 초기화
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 whitespace-nowrap rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
            >
              현재 목록 출력
            </button>
          </div>
        </div>
        <h2 className="hidden text-lg font-bold text-stone-950 print:block">
          {searchName.trim() ? `${searchName.trim()} 개인별 당번 일정` : "전체 빵 수령 당번표"}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {searchName.trim()
            ? `${searchName.trim()} 검색 결과 ${filteredAssignments.length}건`
            : `전체 일정 ${assignments.length}건`}
        </p>
      </section>

      <div className="space-y-3 lg:hidden">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <article
              key={`${assignment.week}-${assignment.date}-card`}
              className="rounded-md border border-stone-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-stone-950">{assignment.week}주차</div>
                  <div className="mt-1 text-sm font-semibold text-stone-800">{assignment.dateLabel}</div>
                </div>
                <span className="whitespace-nowrap rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700">
                  {assignment.backupTeam}
                </span>
              </div>
              {assignment.holidayName ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  {assignment.movedFrom} 공휴일({assignment.holidayName})로 목요일 진행
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-800">
                  {assignment.workerSupportName}
                </span>
                {assignment.activeTeams.map((team) => (
                  <span
                    key={`${assignment.date}-${team}-card`}
                    className={`break-keep rounded-md border px-2.5 py-1 text-xs font-semibold ${teamBadgeStyles[team]}`}
                    title={team}
                  >
                    {assignment.pickupByTeam[team] ?? `${team} 담당자 미지정`}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-500">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-md border border-stone-200 bg-white print:block print:overflow-visible lg:block">
        <div className="overflow-x-auto print:overflow-visible">
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
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-stone-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
