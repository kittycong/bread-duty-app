export type TeamName = "사무행정팀" | "활동지원팀" | "복지사업팀";

export type Employee = {
  id: string;
  name: string;
  team: TeamName;
  status: "active" | "retired";
  effectiveFrom: string;
  retiredFrom?: string;
  replacementFor?: string;
};

export type WorkerSupport = {
  name: string;
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
  activeTeams: TeamName[];
  pickupByTeam: Partial<Record<TeamName, string>>;
  pickupMembers: string[];
  workerSupportName: string;
  holidayName?: string;
  movedFrom?: string;
};

export type AssignmentOverrides = Record<string, Partial<Record<TeamName, string>>>;

export type SharedDutySettings = {
  assignmentOverrides: AssignmentOverrides;
  employees: Employee[];
  workerSupport: WorkerSupport;
  updatedAt?: string;
};
