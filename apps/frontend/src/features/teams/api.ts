import { httpClient } from '@/lib/httpClient'

interface TeamResponse {
  id: string
  semester: string
  code: string
  project: { id: string; name: string }
  members: Array<{ id: string; name: string }>
}

export async function joinTeam(code: string): Promise<TeamResponse> {
  const { data } = await httpClient.post<TeamResponse>('/teams/join', { code })
  return data
}
