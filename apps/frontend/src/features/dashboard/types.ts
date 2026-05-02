export interface DashboardData {
  totalOscs: number
  activeProjects: number
  blockedOscs: number
  availableOscs: number
  pendingProjects: number
  signUp: {
    enabled: boolean
    updatedAt: string
  }
}
