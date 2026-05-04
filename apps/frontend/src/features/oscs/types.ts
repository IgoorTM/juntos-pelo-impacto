export type OscStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'BLOCKED'

export interface Osc {
  id: string
  name: string
  category: string | null
  description: string
  email: string | null
  phone: string | null
  status: OscStatus
  projectCount: number
}

export interface CreateOscDto {
  name: string
  category?: string
  description: string
  email?: string
  phone?: string
}

export interface UpdateOscDto {
  name?: string
  category?: string
  description?: string
  email?: string
  phone?: string
  status?: OscStatus
}

export interface OscListParams {
  page: number
  limit: number
  search?: string
  status?: OscStatus
}

export interface OscListPage {
  data: Osc[]
  total: number
  page: number
  limit: number
  totalPages: number
}
