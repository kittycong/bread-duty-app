import type { DutyAssignment, TeamName } from "@/types";
import { employees, teamNames } from "@/lib/employees";
import { getPublicHoliday } from "@/lib/holidays";
import type { Employee, WorkerSupport } from "@/types";

export const backupCycle: TeamName[] = ["활동지원팀", "복지사업팀", "사무행정팀"];
export const defaultWorkerSupport: WorkerSupport = { name: "근로지원인" };
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function moveHolidayToNextDay(date: Date): { date: Date; holidayName?: string; movedFrom?: string } {
  const formattedDate = formatDate(date);
  const holidayName = getPublicHoliday(formattedDate);

  if (!holidayName) {
    return { date };
  }

  return {
    date: addDays(date, 1),
    holidayName,
    movedFrom: formattedDate
  };
}

function getDateParts(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = weekdays[date.getUTCDay()];
  const dateText = formatDate(date);

  return {
    year,
    month,
    day,
    weekday,
    dateText,
    dateLabel: `${dateText} (${weekday})`
  };
}

function getActiveEmployeesByTeamFromRoster(roster: Employee[], team: TeamName): Employee[] {
  return roster.filter((employee) => employee.team === team && employee.status === "active");
}

function isEmployeeActiveOnDate(employee: Employee, date: string) {
  return (
    employee.status === "active" &&
    employee.effectiveFrom <= date &&
    (!employee.retiredFrom || date < employee.retiredFrom)
  );
}

function getActiveEmployeesByTeamOnDate(roster: Employee[], team: TeamName, date: string): Employee[] {
  return roster.filter((employee) => employee.team === team && isEmployeeActiveOnDate(employee, date));
}

export function generatePickupMembers(
  backupTeam: TeamName,
  weekIndex = 0,
  roster: Employee[] = employees,
  date = "0000-00-00",
  workerSupport: WorkerSupport = defaultWorkerSupport
): string[] {
  const activeTeams = teamNames.filter((team) => team !== backupTeam);
  const members = [workerSupport.name || defaultWorkerSupport.name];

  activeTeams.forEach((team) => {
    const list =
      date === "0000-00-00"
        ? getActiveEmployeesByTeamFromRoster(roster, team)
        : getActiveEmployeesByTeamOnDate(roster, team, date);
    const index = weekIndex % list.length;
    members.push(list[index]?.name ?? `${team} 담당자 미지정`);
  });

  return members;
}

export function generateDuty(
  _date: string,
  backupTeam: TeamName,
  weekIndex = 0,
  roster: Employee[] = employees,
  workerSupport: WorkerSupport = defaultWorkerSupport
): string[] {
  return generatePickupMembers(backupTeam, weekIndex, roster, _date, workerSupport);
}

export function generateSchedule(
  startDate: string,
  weeks: number,
  roster: Employee[] = employees,
  workerSupport: WorkerSupport = defaultWorkerSupport
): DutyAssignment[] {
  const schedule: DutyAssignment[] = [];

  for (let i = 0; i < weeks; i += 1) {
    const wednesday = addDays(parseDate(startDate), i * 7);
    const moved = moveHolidayToNextDay(wednesday);

    const backupTeam = backupCycle[i % backupCycle.length];
    const dateParts = getDateParts(moved.date);

    schedule.push({
      week: i + 1,
      date: dateParts.dateText,
      dateLabel: dateParts.dateLabel,
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      weekday: dateParts.weekday,
      backupTeam,
      pickupMembers: generateDuty(dateParts.dateText, backupTeam, i, roster, workerSupport),
      holidayName: moved.holidayName,
      movedFrom: moved.movedFrom
    });
  }

  return schedule;
}

export function generateScheduleUntil(
  startDate: string,
  endDate: string,
  roster: Employee[] = employees,
  workerSupport: WorkerSupport = defaultWorkerSupport
): DutyAssignment[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const weeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return generateSchedule(startDate, weeks, roster, workerSupport).filter((assignment) => parseDate(assignment.date) <= end);
}
