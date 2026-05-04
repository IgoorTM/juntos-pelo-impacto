import { httpClient } from '@/lib/httpClient'
import type { DashboardData } from './types'

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await httpClient.get<DashboardData>('/dashboard')
  return data
}

export async function toggleSignUp(enabled: boolean): Promise<{ signUpEnabled: boolean }> {
  const { data } = await httpClient.patch<{ signUpEnabled: boolean }>('/auth/sign-up/toggle', {
    enabled,
  })
  return data
}
