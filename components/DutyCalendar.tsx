"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicHoliday } from "@/lib/holidays";
import { teamNames } from "@/lib/employees";
import type { DutyAssignment, TeamName } from "@/types";

type AssignmentUpdate = {
  date: string;
  member: string;
  team: TeamName;
};

type DutyCalendarProps = {
  assignments: DutyAssignment[];
  onAssignmentMembersChange: (updates: AssignmentUpdate[]) => void;
};

type TeamSwapTarget = {
  assignment: DutyAssignment;
  member: string;
};

type DraggedTeamAssignment = {
  date: string;
  team: TeamName;
};

const weekHeaders = ["일", "월", "화", "수", "목", "금", "토"];

const teamBadgeStyles: Record<TeamName, string> = {
  "사무행정팀": "border-pink-200 bg-pink-50 text-pink-900",
  "활동지원팀": "border-lime-200 bg-lime-50 text-lime-900",
  "복지사업팀": "border-yellow-200 bg-yellow-50 text-yellow-900"
};

const teamDropStyles: Record<TeamName, string> = {
  "사무행정팀": "hover:border-pink-400 hover:bg-pink-100",
  "활동지원팀": "hover:border-lime-400 hover:bg-lime-100",
  "복지사업팀": "hover:border-yellow-400 hover:bg-yellow-100"
};

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

function getKoreaTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getActiveTeams(assignment: DutyAssignment): TeamName[] {
  return assignment.activeTeams ?? teamNames.filter((team) => team !== assignment.backupTeam);
}

function getTeamMember(assignment: DutyAssignment, team: TeamName) {
  return assignment.pickupByTeam?.[team];
}

function swapTeamMembers(
  currentAssignment: DutyAssignment,
  targetAssignment: DutyAssignment,
  team: TeamName
): AssignmentUpdate[] {
  const currentMember = getTeamMember(currentAssignment, team);
  const targetMember = getTeamMember(targetAssignment, team);

  if (!currentMember || !targetMember) {
    return [];
  }

  return [
    { date: currentAssignment.date, team, member: targetMember },
    { date: targetAssignment.date, team, member: currentMember }
  ];
}

function findSwapTarget(
  assignments: DutyAssignment[],
  selectedAssignment: DutyAssignment,
  team: TeamName,
  direction: -1 | 1
): TeamSwapTarget | undefined {
  const selectedIndex = assignments.findIndex((assignment) => assignment.date === selectedAssignment.date);

  for (let index = selectedIndex + direction; index >= 0 && index < assignments.length; index += direction) {
    const assignment = assignments[index];
    const member = getTeamMember(assignment, team);

    if (member) {
      return { assignment, member };
    }
  }

  return undefined;
}

export default function DutyCalendar({ assignments, onAssignmentMembersChange }: DutyCalendarProps) {
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<DutyAssignment | null>(null);
  const [todayKey, setTodayKey] = useState("");
  const [draggedAssignment, setDraggedAssignment] = useState<DraggedTeamAssignment | null>(null);
  const assignmentMap = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.date, assignment])),
    [assignments]
  );
  const months = useMemo(() => {
    const seen = new Set<string>();
    return assignments
      .map((assignment) => ({ year: assignment.year, month: assignment.month }))
      .filter((month) => {
        const key = `${month.year}-${month.month}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }, [assignments]);
  const currentMonth = months[monthIndex] ?? { year: 2026, month: 5 };
  const nextMonth = months[monthIndex + 1];
  const visibleMonths = nextMonth ? [currentMonth, nextMonth] : [currentMonth];
  const latestSelectedAssignment = selectedAssignment
    ? assignments.find((assignment) => assignment.date === selectedAssignment.date) ?? selectedAssignment
    : null;

  useEffect(() => {
    setTodayKey(getKoreaTodayKey());
  }, []);

  function closeAssignment() {
    setSelectedAssignment(null);
  }

  function swapWithTarget(team: TeamName, target: TeamSwapTarget) {
    if (!latestSelectedAssignment) {
      return;
    }

    const updates = swapTeamMembers(latestSelectedAssignment, target.assignment, team);
    if (updates.length > 0) {
      onAssignmentMembersChange(updates);
    }
  }

  function swapAssignmentsByDate(sourceDate: string, targetDate: string, team: TeamName) {
    const sourceAssignment = assignmentMap.get(sourceDate);
    const targetAssignment = assignmentMap.get(targetDate);

    if (!sourceAssignment || !targetAssignment || sourceDate === targetDate) {
      return;
    }

    const updates = swapTeamMembers(sourceAssignment, targetAssignment, team);
    if (updates.length > 0) {
      onAssignmentMembersChange(updates);
    }
  }

  function dropOnTeamBadge(targetDate: string, targetTeam: TeamName) {
    if (!draggedAssignment || draggedAssignment.team !== targetTeam) {
      setDraggedAssignment(null);
      return;
    }

    swapAssignmentsByDate(draggedAssignment.date, targetDate, targetTeam);
    setDraggedAssignment(null);
  }

  return (
    <section aria-labelledby="calendar-month" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="calendar-month" className="text-xl font-bold text-stone-950">
            {nextMonth
              ? `${currentMonth.year}년 ${currentMonth.month}월 - ${nextMonth.year}년 ${nextMonth.month}월 달력형 당번표`
              : `${currentMonth.year}년 ${currentMonth.month}월 달력형 당번표`}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            당월과 다음 달을 함께 표시합니다. 팀별 담당자를 끌어 같은 팀 다른 주차에 놓으면 순서가 교체됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthIndex((index) => Math.max(0, index - 1))}
            disabled={monthIndex === 0}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            이전 달
          </button>
          <button
            type="button"
            onClick={() => setMonthIndex((index) => Math.min(months.length - 1, index + 1))}
            disabled={monthIndex >= months.length - 1}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
          >
            다음 달
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {visibleMonths.map((visibleMonth) => {
          const cells = getMonthCells(visibleMonth.year, visibleMonth.month);

          return (
            <div key={`${visibleMonth.year}-${visibleMonth.month}`} className="overflow-x-auto rounded-md border border-stone-200 bg-white">
              <article className="min-w-[760px]">
                <div className="border-b border-stone-200 bg-stone-50 px-3 py-2">
                  <h3 className="text-base font-bold text-stone-950">
                    {visibleMonth.year}년 {visibleMonth.month}월
                  </h3>
                </div>
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
                        : `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const assignment = assignmentMap.get(dateKey);
                    const holidayName = dateKey ? getPublicHoliday(dateKey) : undefined;
                    const isToday = dateKey === todayKey;
                    const isTodayDuty = isToday && Boolean(assignment);

                    return (
                      <div
                        key={`${visibleMonth.year}-${visibleMonth.month}-${cellIndex}`}
                        className={
                          [
                            "min-h-36 border-b border-r p-2 text-xs",
                            holidayName ? "border-red-100 bg-red-50" : "border-stone-100",
                            isToday ? "relative z-10 ring-2 ring-stone-900 ring-inset" : ""
                          ].join(" ")
                        }
                      >
                        {day === null ? null : (
                          <>
                            <div className="flex min-h-5 items-center justify-between gap-1">
                              <span className="font-semibold text-stone-700">{day}</span>
                              {isToday ? (
                                <span className="rounded border border-stone-900 bg-stone-900 px-1 text-[10px] font-bold text-white">
                                  오늘
                                </span>
                              ) : holidayName ? (
                                <span className="rounded border border-red-200 bg-white px-1 text-[10px] font-bold text-red-700">
                                  공휴일
                                </span>
                              ) : null}
                            </div>
                            {holidayName ? (
                              <div className="mt-1 text-[11px] font-semibold leading-4 text-red-700">
                                {holidayName}
                              </div>
                            ) : null}
                            {assignment ? (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedAssignment(assignment)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedAssignment(assignment);
                                  }
                                }}
                                className={[
                                  "mt-2 block w-full cursor-pointer rounded-md p-2 text-left text-amber-950 transition focus:outline-none focus:ring-2 focus:ring-amber-600",
                                  isTodayDuty
                                    ? "border-2 border-stone-900 bg-amber-100 shadow-sm"
                                    : "border border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100"
                                ].join(" ")}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold">{assignment.week}주차</span>
                                  <span className="text-[11px] font-semibold">
                                    {isTodayDuty ? "오늘 당번" : assignment.backupTeam}
                                  </span>
                                </div>
                                {isTodayDuty ? (
                                  <div className="mt-1 text-[11px] font-bold text-stone-900">
                                    백업팀: {assignment.backupTeam}
                                  </div>
                                ) : null}
                                {assignment.holidayName ? (
                                  <div className="mt-1 font-semibold text-red-700">공휴일 다음 날</div>
                                ) : null}
                                <div className="mt-2 space-y-1">
                                  <div className="rounded border border-stone-200 bg-stone-50 px-2 py-1 font-semibold leading-4 text-stone-800">
                                    1. {assignment.workerSupportName}
                                  </div>
                                  {assignment.activeTeams.map((team, index) => {
                                    const member = assignment.pickupByTeam[team] ?? `${team} 담당자 미지정`;
                                    const canDrop =
                                      draggedAssignment?.team === team && draggedAssignment.date !== assignment.date;

                                    return (
                                      <div
                                        key={`${assignment.date}-${team}`}
                                        draggable
                                        onClick={(event) => event.stopPropagation()}
                                        onDragStart={(event) => {
                                          event.dataTransfer.effectAllowed = "move";
                                          event.dataTransfer.setData("text/plain", `${assignment.date}|${team}`);
                                          setDraggedAssignment({ date: assignment.date, team });
                                        }}
                                        onDragEnd={() => setDraggedAssignment(null)}
                                        onDragOver={(event) => {
                                          if (draggedAssignment?.team === team) {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = "move";
                                          }
                                        }}
                                        onDrop={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          dropOnTeamBadge(assignment.date, team);
                                        }}
                                        className={[
                                          "rounded border px-2 py-1 font-semibold leading-4 transition",
                                          "cursor-grab active:cursor-grabbing",
                                          teamBadgeStyles[team],
                                          canDrop ? `ring-2 ring-stone-900 ring-offset-1 ${teamDropStyles[team]}` : ""
                                        ].join(" ")}
                                        title={`${team} 담당자. 같은 팀 담당자에게 끌어 놓으면 교체됩니다.`}
                                      >
                                        {index + 2}. {member}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {latestSelectedAssignment ? (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 p-3 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-md bg-white p-5 shadow-xl sm:max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-700">{latestSelectedAssignment.dateLabel}</p>
                <h3 className="mt-1 text-xl font-bold text-stone-950">
                  {latestSelectedAssignment.week}주차 팀별 순서 조정
                </h3>
                <p className="mt-1 text-sm text-stone-600">백업팀: {latestSelectedAssignment.backupTeam}</p>
              </div>
              <button
                type="button"
                onClick={closeAssignment}
                className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
              근로지원인은 고정입니다. 달력 칸의 팀별 담당자를 끌어 같은 팀 다른 주차에 놓으면 교체됩니다.
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-stone-200 bg-white p-3">
                <div className="text-xs font-semibold text-stone-500">고정 담당</div>
                <div className="mt-1 font-bold text-stone-950">{latestSelectedAssignment.pickupMembers[0]}</div>
              </div>

              {getActiveTeams(latestSelectedAssignment).map((team) => {
                const currentMember = getTeamMember(latestSelectedAssignment, team);
                const previousTarget = findSwapTarget(assignments, latestSelectedAssignment, team, -1);
                const nextTarget = findSwapTarget(assignments, latestSelectedAssignment, team, 1);

                return (
                  <section
                    key={team}
                    className={`rounded-md border bg-white p-3 ${teamBadgeStyles[team]}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold text-stone-500">{team}</div>
                        <div className="mt-1 text-lg font-bold text-stone-950">{currentMember}</div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => previousTarget && swapWithTarget(team, previousTarget)}
                          disabled={!previousTarget}
                          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                        >
                          <span className="block">이전 담당 주차와 교체</span>
                          <span className="mt-1 block font-normal">
                            {previousTarget
                              ? `${previousTarget.assignment.week}주차 ${previousTarget.member}`
                              : "교체 가능 주차 없음"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => nextTarget && swapWithTarget(team, nextTarget)}
                          disabled={!nextTarget}
                          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                        >
                          <span className="block">다음 담당 주차와 교체</span>
                          <span className="mt-1 block font-normal">
                            {nextTarget
                              ? `${nextTarget.assignment.week}주차 ${nextTarget.member}`
                              : "교체 가능 주차 없음"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
