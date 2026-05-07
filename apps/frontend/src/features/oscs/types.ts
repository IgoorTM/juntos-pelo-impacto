export type OscStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'BLOCKED'

export type OscCategory =
  | 'EDUCACAO'
  | 'CULTURA'
  | 'ASSISTENCIA_SOCIAL'
  | 'SAUDE'
  | 'MEIO_AMBIENTE'
  | 'OUTROS'

export const OSC_CATEGORY_LABEL: Record<OscCategory, string> = {
  EDUCACAO: 'Educação',
  CULTURA: 'Cultura',
  ASSISTENCIA_SOCIAL: 'Assistência Social',
  SAUDE: 'Saúde',
  MEIO_AMBIENTE: 'Meio Ambiente',
  OUTROS: 'Outros',
}

export interface Osc {
  id: string
  name: string
  category: OscCategory
  description: string
  email: string | null
  phone: string | null
  status: OscStatus
  projectCount: number
}

export interface CreateOscDto {
  name: string
  category?: OscCategory
  description: string
  email?: string
  phone?: string
}

export interface UpdateOscDto {
  name?: string
  category?: OscCategory
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
