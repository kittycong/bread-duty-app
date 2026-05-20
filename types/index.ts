export type TeamName = "사무행정팀" | "활동지원팀" | "복지사업팀";

export type Employee = {
  id: string;
  name: string;
  team: TeamName;
  status: "active" | "retired";
  replacementFor?: string;
};

export type DutyAssignment = {
  week: number;
  date: string;
  dateLabel: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  backupTeam: TeamName;
  pickupMembers: string[];
  holidayName?: string;
  movedFrom?: string;
};
