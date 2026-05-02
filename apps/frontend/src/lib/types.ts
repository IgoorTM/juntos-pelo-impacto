export type UserRole = 'COORDINATOR' | 'STUDENT' | 'ADMIN'

export interface ApiError {
  status: number
  message: string
}
