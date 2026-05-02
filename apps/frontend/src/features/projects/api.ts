import { httpClient } from '@/lib/httpClient'
import type { Project, ProjectStatus } from './types'

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await httpClient.get<Project[]>('/projects')
  return data
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  const { data } = await httpClient.patch<Project>(`/projects/${id}/status`, { status })
  return data
}

export async function continueProject(id: string): Promise<Project> {
  const { data } = await httpClient.post<Project>(`/projects/${id}/continue`)
  return data
}
