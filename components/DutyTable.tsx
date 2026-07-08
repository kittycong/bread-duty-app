"use client";

import { useMemo, useState } from "react";
import type { DutyAssignment, TeamName } from "@/types";

type DutyTableProps = {
  assignments: DutyAssignment[];
};

type DuplicateWarning = {
  currentDate: string;
  currentWeek: number;
  member: string;
  previousDate: string;
  previousWeek: number;
  team: TeamName;
};

const teamBadgeStyles: Record<TeamName, string> = {
  "사무행정팀": "border-pink-200 bg-pink-50 text-pink-900",
  "활동지원팀": "border-lime-200 bg-lime-50 text-lime-900",
  "복지사업팀": "border-yellow-200 bg-yellow-50 text-yellow-900"
};

function getKoreaTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getAssignmentMembers(assignment: DutyAssignment) {
  return [
    assignment.workerSupportName,
    ...assignment.activeTeams.map((team) => assignment.pickupByTeam[team] ?? "")
  ].filter(Boolean);
}

function getConsecutiveDuplicateWarnings(assignments: DutyAssignment[]) {
  const lastByTeam: Partial<Record<TeamName, { date: string; member: string; week: number }>> = {};
  const warnings: DuplicateWarning[] = [];

  assignments.forEach((assignment) => {
    assignment.activeTeams.forEach((team) => {
      const member = assignment.pickupByTeam[team];

      if (!member || member.endsWith("담당자 미지정")) {
        return;
      }

      const previous = lastByTeam[team];
      if (previous?.member === member) {
        warnings.push({
          currentDate: assignment.date,
          currentWeek: assignment.week,
          member,
          previousDate: previous.date,
          previousWeek: previous.week,
          team
        });
      }

      lastByTeam[team] = {
        date: assignment.date,
        member,
        week: assignment.week
      };
    });
  });

  return warnings;
}

function AssignmentCard({ assignment, todayKey }: { assignment: DutyAssignment; todayKey: string }) {
  const isToday = assignment.date === todayKey;

  return (
    <article
      className={[
        "rounded-md border bg-white p-4",
        isToday ? "border-sky-600 bg-sky-50 ring-2 ring-sky-600" : "border-stone-200"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-stone-950">{assignment.week}주차</div>
          <div className="mt-1 text-sm font-semibold text-stone-800">{assignment.dateLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isToday ? (
            <span className="whitespace-nowrap rounded border border-sky-700 bg-sky-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
              오늘
            </span>
          ) : null}
          <span className="whitespace-nowrap rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700">
            {assignment.backupTeam}
          </span>
        </div>
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
  );
}

function AssignmentRows({ assignments, todayKey }: { assignments: DutyAssignment[]; todayKey: string }) {
  return (
    <>
      {assignments.map((assignment) => {
        const isToday = assignment.date === todayKey;

        return (
          <tr
            key={`${assignment.week}-${assignment.date}`}
            className={isToday ? "bg-sky-50 ring-2 ring-inset ring-sky-600" : "hover:bg-stone-50"}
          >
            <td className="whitespace-nowrap px-4 py-4 font-medium text-stone-950">
              {assignment.week}주차
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-stone-700">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-900">{assignment.dateLabel}</span>
                {isToday ? (
                  <span className="rounded border border-sky-700 bg-sky-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    오늘
                  </span>
                ) : null}
              </div>
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
        );
      })}
    </>
  );
}

export default function DutyTable({ assignments }: DutyTableProps) {
  const [searchName, setSearchName] = useState("");
  const [showPastAssignments, setShowPastAssignments] = useState(false);
  const todayKey = useMemo(() => getKoreaTodayKey(), []);
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
  const pastAssignments = useMemo(
    () => filteredAssignments.filter((assignment) => assignment.date < todayKey),
    [filteredAssignments, todayKey]
  );
  const currentAssignments = useMemo(
    () => filteredAssignments.filter((assignment) => assignment.date >= todayKey),
    [filteredAssignments, todayKey]
  );
  const visibleAssignments = showPastAssignments
    ? [...pastAssignments, ...currentAssignments]
    : currentAssignments;
  const duplicateWarnings = useMemo(
    () => getConsecutiveDuplicateWarnings(filteredAssignments),
    [filteredAssignments]
  );

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
              onClick={() => setShowPastAssignments((current) => !current)}
              disabled={pastAssignments.length === 0}
              className="h-10 whitespace-nowrap rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              {showPastAssignments ? "지난 일정 접기" : `지난 일정 ${pastAssignments.length}건`}
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
            : `오늘 이후 ${currentAssignments.length}건 · 지난 일정 ${pastAssignments.length}건`}
        </p>
        <div
          className={
            duplicateWarnings.length > 0
              ? "mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              : "mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          <div className="font-semibold">
            {duplicateWarnings.length > 0
              ? `연속 중복 ${duplicateWarnings.length}건 확인됨`
              : "연속 중복 없음"}
          </div>
          {duplicateWarnings.length > 0 ? (
            <ul className="mt-1 space-y-1 text-xs font-semibold">
              {duplicateWarnings.slice(0, 3).map((warning) => (
                <li key={`${warning.team}-${warning.currentWeek}-${warning.member}`}>
                  {warning.team} {warning.member}: {warning.previousWeek}주차({warning.previousDate})와{" "}
                  {warning.currentWeek}주차({warning.currentDate}) 연속 배정
                </li>
              ))}
              {duplicateWarnings.length > 3 ? <li>외 {duplicateWarnings.length - 3}건</li> : null}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="space-y-3 lg:hidden">
        {!showPastAssignments && pastAssignments.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowPastAssignments(true)}
            className="print-hidden w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700"
          >
            지난 일정 {pastAssignments.length}건 접힘
          </button>
        ) : null}
        {visibleAssignments.length > 0 ? (
          visibleAssignments.map((assignment) => (
            <AssignmentCard key={`${assignment.week}-${assignment.date}-card`} assignment={assignment} todayKey={todayKey} />
          ))
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-500">
            검색 결과가 없습니다.
          </div>
        ) : null}
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
              {visibleAssignments.length > 0 || pastAssignments.length > 0 ? (
                <>
                  {!showPastAssignments && pastAssignments.length > 0 ? (
                    <tr className="print-hidden bg-stone-50">
                      <td colSpan={4} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setShowPastAssignments(true)}
                          className="text-sm font-semibold text-stone-700 underline-offset-2 hover:underline"
                        >
                          지난 일정 {pastAssignments.length}건 접힘
                        </button>
                      </td>
                    </tr>
                  ) : null}
                  <AssignmentRows assignments={visibleAssignments} todayKey={todayKey} />
                </>
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-stone-500">
                    오늘 이후 일정이 없습니다.
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
