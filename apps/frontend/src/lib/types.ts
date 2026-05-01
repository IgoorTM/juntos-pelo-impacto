export type UserRole = 'COORDINATOR' | 'STUDENT'

export interface ApiError {
  status: number
  message: string
}
