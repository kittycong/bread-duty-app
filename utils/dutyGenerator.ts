import type { DutyAssignment, TeamName } from "@/types";

const adminTeam = ["최수연", "조승민", "노현숙"];
const supportTeam = ["권은지", "김유리", "정채윤"];
const businessTeam = ["김은서", "송지은", "강지나", "최유나", "인상필"];

const teamMap: Record<TeamName, string[]> = {
  "사무행정팀": adminTeam,
  "활동지원팀": supportTeam,
  "복지사업팀": businessTeam
};

const teams: TeamName[] = ["사무행정팀", "활동지원팀", "복지사업팀"];
export const backupCycle: TeamName[] = ["활동지원팀", "복지사업팀", "사무행정팀"];

const publicHolidays = new Set([
  "2026-06-03"
]);

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

function moveHolidayToNextDay(date: Date): Date {
  const formattedDate = formatDate(date);
  return publicHolidays.has(formattedDate) ? addDays(date, 1) : date;
}

export function generatePickupMembers(backupTeam: TeamName): string[] {
  const activeTeams = teams.filter((team) => team !== backupTeam);
  const members = ["근로지원인"];

  activeTeams.forEach((team) => {
    const list = teamMap[team];
    const index = Math.floor(Math.random() * list.length);
    members.push(list[index]);
  });

  return members;
}

export function generateDuty(_date: string, backupTeam: TeamName): string[] {
  return generatePickupMembers(backupTeam);
}

export function generateSchedule(startDate: string, weeks: number): DutyAssignment[] {
  const schedule: DutyAssignment[] = [];

  for (let i = 0; i < weeks; i += 1) {
    const wednesday = addDays(parseDate(startDate), i * 7);
    const dutyDate = moveHolidayToNextDay(wednesday);

    const backupTeam = backupCycle[i % backupCycle.length];
    const formattedDate = formatDate(dutyDate);

    schedule.push({
      week: i + 1,
      date: formattedDate,
      backupTeam,
      pickupMembers: generateDuty(formattedDate, backupTeam)
    });
  }

  return schedule;
}
