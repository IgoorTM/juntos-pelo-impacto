export type OscStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'BLOCKED'

export interface Osc {
  id: string
  name: string
  description: string
  email: string | null
  phone: string | null
  status: OscStatus
}

export interface CreateOscDto {
  name: string
  description: string
  email?: string
  phone?: string
}

export interface UpdateOscDto {
  name?: string
  description?: string
  email?: string
  phone?: string
  status?: OscStatus
}
