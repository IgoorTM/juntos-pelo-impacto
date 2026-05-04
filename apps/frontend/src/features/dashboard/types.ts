export interface DashboardData {
  totalOscs: number
  activeProjects: number
  availableOscs: number
  pendingProjects: number
  signUp: {
    enabled: boolean
    updatedAt: string
  }
}
