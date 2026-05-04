import { httpClient } from '@/lib/httpClient'
import type { Osc, OscListPage, OscListParams, CreateOscDto, UpdateOscDto } from './types'

export async function fetchOscs(params: OscListParams): Promise<OscListPage> {
  const { data } = await httpClient.get<OscListPage>('/oscs', { params })
  return data
}

export async function createOsc(dto: CreateOscDto): Promise<Osc> {
  const { data } = await httpClient.post<Osc>('/oscs', dto)
  return data
}

export async function updateOsc(id: string, dto: UpdateOscDto): Promise<Osc> {
  const { data } = await httpClient.patch<Osc>(`/oscs/${id}`, dto)
  return data
}
