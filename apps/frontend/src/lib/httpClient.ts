import axios from 'axios'
import type { ApiError } from './types'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (err: unknown) => {
    const axiosErr = err as { response?: { status: number; data?: { message?: string } }; message?: string }
    const apiError: ApiError = {
      status: axiosErr.response?.status ?? 0,
      message: axiosErr.response?.data?.message ?? axiosErr.message ?? 'Unknown error',
    }
    return Promise.reject(apiError)
  }
)
