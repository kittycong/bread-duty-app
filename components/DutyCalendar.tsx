"use client";

import { useMemo, useState } from "react";
import { getPublicHoliday } from "@/lib/holidays";
import type { DutyAssignment } from "@/types";

type DutyCalendarProps = {
  assignments: DutyAssignment[];
  onAssignmentMembersChange: (date: string, pickupMembers: string[]) => void;
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

function moveMember(members: string[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= members.length) {
    return members;
  }

  const nextMembers = [...members];
  const [member] = nextMembers.splice(index, 1);
  nextMembers.splice(nextIndex, 0, member);
  return nextMembers;
}

export default function DutyCalendar({ assignments, onAssignmentMembersChange }: DutyCalendarProps) {
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<DutyAssignment | null>(null);
  const [draftMembers, setDraftMembers] = useState<string[]>([]);
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
  const cells = getMonthCells(currentMonth.year, currentMonth.month);

  function openAssignment(assignment: DutyAssignment) {
    setSelectedAssignment(assignment);
    setDraftMembers(assignment.pickupMembers);
  }

  function closeAssignment() {
    setSelectedAssignment(null);
    setDraftMembers([]);
  }

  function saveAssignmentOrder() {
    if (!selectedAssignment) {
      return;
    }

    onAssignmentMembersChange(selectedAssignment.date, draftMembers);
    closeAssignment();
  }

  return (
    <section aria-labelledby="calendar-month" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="calendar-month" className="text-xl font-bold text-stone-950">
            {currentMonth.year}년 {currentMonth.month}월 달력형 당번표
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            수요일 기준, 공휴일은 목요일 표시. 당번 카드를 누르면 크게 보고 순서를 바꿀 수 있습니다.
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

      <div className="overflow-x-auto rounded-md border border-stone-200 bg-white">
        <article className="min-w-[760px]">
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
                  : `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const assignment = assignmentMap.get(dateKey);
              const holidayName = dateKey ? getPublicHoliday(dateKey) : undefined;

              return (
                <div
                  key={`${currentMonth.year}-${currentMonth.month}-${cellIndex}`}
                  className={
                    holidayName
                      ? "min-h-36 border-b border-r border-red-100 bg-red-50 p-2 text-xs"
                      : "min-h-36 border-b border-r border-stone-100 p-2 text-xs"
                  }
                >
                  {day === null ? null : (
                    <>
                      <div className="flex min-h-5 items-center justify-between gap-1">
                        <span className="font-semibold text-stone-700">{day}</span>
                        {holidayName ? (
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
                        <button
                          type="button"
                          onClick={() => openAssignment(assignment)}
                          className="mt-2 block w-full rounded-md border border-amber-200 bg-amber-50 p-2 text-left text-amber-950 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{assignment.week}주차</span>
                            <span className="text-[11px] font-semibold">{assignment.backupTeam}</span>
                          </div>
                          {assignment.holidayName ? (
                            <div className="mt-1 font-semibold text-red-700">공휴일 다음 날</div>
                          ) : null}
                          <ol className="mt-2 space-y-1">
                            {assignment.pickupMembers.map((member, index) => (
                              <li
                                key={`${assignment.date}-${member}-${index}`}
                                className="rounded border border-amber-100 bg-white px-2 py-1 font-semibold leading-4 text-amber-950"
                              >
                                {index + 1}. {member}
                              </li>
                            ))}
                          </ol>
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {selectedAssignment ? (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 p-3 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-md bg-white p-5 shadow-xl sm:max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-700">{selectedAssignment.dateLabel}</p>
                <h3 className="mt-1 text-xl font-bold text-stone-950">
                  {selectedAssignment.week}주차 당번 상세
                </h3>
                <p className="mt-1 text-sm text-stone-600">백업팀: {selectedAssignment.backupTeam}</p>
              </div>
              <button
                type="button"
                onClick={closeAssignment}
                className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                닫기
              </button>
            </div>

            <ol className="mt-5 space-y-2">
              {draftMembers.map((member, index) => (
                <li
                  key={`${member}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50 p-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-stone-500">{index + 1}순위</div>
                    <div className="mt-0.5 font-bold text-stone-950">{member}</div>
                  </div>
                  <div className="flex rounded-md border border-stone-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setDraftMembers((members) => moveMember(members, index, -1))}
                      disabled={index === 0}
                      className="h-8 rounded px-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                    >
                      위
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftMembers((members) => moveMember(members, index, 1))}
                      disabled={index === draftMembers.length - 1}
                      className="h-8 rounded px-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                    >
                      아래
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAssignment}
                className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveAssignmentOrder}
                className="h-10 rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
              >
                이 날짜 순서 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
