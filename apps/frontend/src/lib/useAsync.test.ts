import { renderHook, act } from '@testing-library/react'
import { useAsync } from './useAsync'
import type { ApiError } from './types'

describe('useAsync', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with loading=false, data=null, error=null', () => {
    const { result } = renderHook(() => useAsync<string>())
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets loading=true while executing', async () => {
    let resolve!: (v: string) => void
    const fn = () => new Promise<string>((res) => { resolve = res })
    const { result } = renderHook(() => useAsync<string>())

    act(() => { void result.current.execute(fn) })
    expect(result.current.loading).toBe(true)

    await act(async () => { resolve('done') })
    expect(result.current.loading).toBe(false)
  })

  it('stores data on success', async () => {
    const fn = () => Promise.resolve('hello')
    const { result } = renderHook(() => useAsync<string>())
    await act(async () => { await result.current.execute(fn) })
    expect(result.current.data).toBe('hello')
    expect(result.current.error).toBeNull()
  })

  it('stores error on failure and clears data', async () => {
    const apiError: ApiError = { status: 500, message: 'Server error' }
    const fn = () => Promise.reject(apiError)
    const { result } = renderHook(() => useAsync<string>())
    await act(async () => { await result.current.execute(fn) })
    expect(result.current.error).toEqual(apiError)
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('clears error on re-execute', async () => {
    const fail = () => Promise.reject<string>({ status: 500, message: 'err' })
    const succeed = () => Promise.resolve('ok')
    const { result } = renderHook(() => useAsync<string>())
    await act(async () => { await result.current.execute(fail) })
    expect(result.current.error).not.toBeNull()
    await act(async () => { await result.current.execute(succeed) })
    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe('ok')
  })
})
