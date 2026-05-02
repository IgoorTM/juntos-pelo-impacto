import { useState } from 'react'
import type { ApiError } from './types'

interface AsyncState<T> {
  loading: boolean
  data: T | null
  error: ApiError | null
}

interface UseAsync<T> extends AsyncState<T> {
  execute: (fn: () => Promise<T>) => Promise<void>
}

export function useAsync<T>(): UseAsync<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    data: null,
    error: null,
  })

  async function execute(fn: () => Promise<T>) {
    setState({ loading: true, data: null, error: null })
    try {
      const data = await fn()
      setState({ loading: false, data, error: null })
    } catch (err) {
      setState({ loading: false, data: null, error: err as ApiError })
    }
  }

  return { ...state, execute }
}
