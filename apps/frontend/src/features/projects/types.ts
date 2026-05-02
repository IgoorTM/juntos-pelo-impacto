export type ProjectStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'ONGOING' | 'INCOMPLETE'

export interface TeamMember {
  id: string
  name: string
}

export interface Team {
  id: string
  semester: string
  code: string
  members: TeamMember[]
}

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  osc: { id: string; name: string }
  teams: Team[]
}
