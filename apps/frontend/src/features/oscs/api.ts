import { httpClient } from '@/lib/httpClient'
import type { Osc, CreateOscDto, UpdateOscDto } from './types'

export async function fetchOscs(): Promise<Osc[]> {
  const { data } = await httpClient.get<Osc[]>('/oscs')
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
