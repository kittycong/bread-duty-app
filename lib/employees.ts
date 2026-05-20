import type { Employee, TeamName } from "@/types";

export const teamNames: TeamName[] = ["사무행정팀", "활동지원팀", "복지사업팀"];

export const employees: Employee[] = [
  { id: "admin-choi-su-yeon", name: "최수연", team: "사무행정팀", status: "active" },
  { id: "admin-jo-seung-min", name: "조승민", team: "사무행정팀", status: "active" },
  { id: "admin-no-hyeon-suk", name: "노현숙", team: "사무행정팀", status: "active" },
  { id: "support-kwon-eun-ji", name: "권은지", team: "활동지원팀", status: "active" },
  { id: "support-kim-yu-ri", name: "김유리", team: "활동지원팀", status: "active" },
  { id: "support-jeong-chae-yun", name: "정채윤", team: "활동지원팀", status: "active" },
  { id: "business-kim-eun-seo", name: "김은서", team: "복지사업팀", status: "active" },
  { id: "business-song-ji-eun", name: "송지은", team: "복지사업팀", status: "active" },
  { id: "business-kang-ji-na", name: "강지나", team: "복지사업팀", status: "active" },
  { id: "business-choi-yu-na", name: "최유나", team: "복지사업팀", status: "active" },
  { id: "business-in-sang-pil", name: "인상필", team: "복지사업팀", status: "active" }
];

export function getActiveEmployeesByTeam(team: TeamName): Employee[] {
  return employees.filter((employee) => employee.team === team && employee.status === "active");
}

export function getEmployeesByTeam(team: TeamName): Employee[] {
  return employees.filter((employee) => employee.team === team);
}
