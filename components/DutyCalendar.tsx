"use client";

import { useMemo, useState } from "react";
import type { DutyAssignment } from "@/types";
import { getPublicHoliday } from "@/lib/holidays";

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
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.date, assignment]));
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
  const [monthIndex, setMonthIndex] = useState(0);
  const currentMonth = months[monthIndex] ?? { year: 2026, month: 5 };
  const cells = getMonthCells(currentMonth.year, currentMonth.month);

  return (
    <section aria-labelledby="calendar-month" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="calendar-month" className="text-xl font-bold text-stone-950">
            {currentMonth.year}년 {currentMonth.month}월 달력형 당번표
          </h2>
          <p className="mt-1 text-sm text-stone-600">수요일 기준, 공휴일은 목요일 표시</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthIndex((index) => Math.max(0, index - 1))}
            disabled={monthIndex === 0}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300 hover:bg-stone-100"
          >
            이전 달
          </button>
          <button
            type="button"
            onClick={() => setMonthIndex((index) => Math.min(months.length - 1, index + 1))}
            disabled={monthIndex >= months.length - 1}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300 hover:bg-stone-100"
          >
            다음 달
          </button>
        </div>
      </div>

      <article className="rounded-md border border-stone-200 bg-white">
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
                    ? "min-h-24 border-b border-r border-red-100 bg-red-50 p-1.5 text-xs last:border-r-0"
                    : "min-h-24 border-b border-r border-stone-100 p-1.5 text-xs last:border-r-0"
                }
              >
                {day === null ? null : (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-stone-700">{day}</span>
                      {holidayName ? (
                        <span className="rounded border border-red-200 bg-white px-1 text-[10px] font-bold text-red-700">
                          공휴일
                        </span>
                      ) : null}
                    </div>
                    {holidayName ? (
                      <div className="mt-1 truncate text-[11px] font-semibold text-red-700">
                        {holidayName}
                      </div>
                    ) : null}
                    {assignment ? (
                      <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-1 text-amber-950">
                        <div className="font-semibold">{assignment.week}주차</div>
                        {assignment.holidayName ? (
                          <div className="mt-0.5 font-semibold text-red-700">공휴일 다음 날</div>
                        ) : null}
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
    </section>
  );
}
