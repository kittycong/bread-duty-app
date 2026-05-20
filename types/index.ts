export type TeamName = "사무행정팀" | "활동지원팀" | "복지사업팀";

export type Employee = {
  name: string;
  team: TeamName;
};

export type DutyAssignment = {
  week: number;
  date: string;
  backupTeam: TeamName;
  pickupMembers: string[];
};
