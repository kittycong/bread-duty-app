"use client";

import { useMemo } from "react";
import type { DutyAssignment, TeamName } from "@/types";
import { getDaysUntil, getKoreaTodayKey, getKoreaWeekRange } from "@/utils/dutyGenerator";

type ThisWeekDutyProps = {
  assignments: DutyAssignment[];
};

const teamBadgeStyles: Record<TeamName, string> = {
  "사무행정팀": "border-pink-200 bg-pink-50 text-pink-900",
  "활동지원팀": "border-lime-200 bg-lime-50 text-lime-900",
  "복지사업팀": "border-yellow-200 bg-yellow-50 text-yellow-900"
};

function getDdayLabel(days: number) {
  if (days === 0) {
    return "오늘";
  }

  if (days > 0) {
    return `D-${days}`;
  }

  return `${-days}일 전 완료`;
}

export default function ThisWeekDuty({ assignments }: ThisWeekDutyProps) {
  const todayKey = useMemo(() => getKoreaTodayKey(), []);
  const target = useMemo(() => {
    const { start, end } = getKoreaWeekRange(todayKey);
    const thisWeek = assignments.find((assignment) => assignment.date >= start && assignment.date <= end);

    if (thisWeek) {
      return { assignment: thisWeek, isThisWeek: true };
    }

    const upcoming = assignments.find((assignment) => assignment.date >= todayKey);

    return { assignment: upcoming, isThisWeek: false };
  }, [assignments, todayKey]);

  if (!target.assignment) {
    return null;
  }

  const assignment = target.assignment;
  const days = getDaysUntil(todayKey, assignment.date);

  return (
    <section className="print-hidden rounded-md border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-stone-950 sm:text-lg">
            {target.isThisWeek ? "이번 주 당번" : "다음 당번"}
          </h2>
          <span className="rounded border border-amber-700 bg-amber-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {getDdayLabel(days)}
          </span>
        </div>
        <span className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700">
          백업팀 {assignment.backupTeam}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-stone-800 sm:text-base">
        {assignment.week}주차 · {assignment.dateLabel}
      </p>

      {assignment.holidayName ? (
        <p className="mt-2 inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
          {assignment.movedFrom} 공휴일({assignment.holidayName})로 목요일 진행
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-sm font-semibold text-stone-800">
          {assignment.workerSupportName}
        </span>
        {assignment.activeTeams.map((team) => (
          <span
            key={`this-week-${team}`}
            className={`break-keep rounded-md border px-2.5 py-1 text-sm font-semibold ${teamBadgeStyles[team]}`}
            title={team}
          >
            {assignment.pickupByTeam[team] ?? `${team} 담당자 미지정`}
          </span>
        ))}
      </div>
    </section>
  );
}
