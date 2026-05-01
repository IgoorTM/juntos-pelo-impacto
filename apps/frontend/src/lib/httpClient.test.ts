import MockAdapter from 'axios-mock-adapter'
import { httpClient } from './httpClient'
import type { ApiError } from './types'

const mock = new MockAdapter(httpClient)

afterEach(() => {
  mock.reset()
  localStorage.clear()
})

describe('httpClient', () => {
  describe('auth interceptor', () => {
    it('injects Authorization header when token is in localStorage', async () => {
      localStorage.setItem('token', 'test-token')
      let capturedHeader: string | undefined
      mock.onGet('/test').reply((config) => {
        capturedHeader = config.headers?.Authorization as string | undefined
        return [200, {}]
      })
      await httpClient.get('/test')
      expect(capturedHeader).toBe('Bearer test-token')
    })

    it('does not inject Authorization header when no token', async () => {
      let capturedHeader: string | undefined
      mock.onGet('/test').reply((config) => {
        capturedHeader = config.headers?.Authorization as string | undefined
        return [200, {}]
      })
      await httpClient.get('/test')
      expect(capturedHeader).toBeUndefined()
    })
  })

  describe('error interceptor', () => {
    it('throws ApiError with status and message on 401', async () => {
      mock.onGet('/test').reply(401, { message: 'Unauthorized' })
      await expect(httpClient.get('/test')).rejects.toMatchObject<Partial<ApiError>>({
        status: 401,
        message: 'Unauthorized',
      })
    })

    it('throws ApiError with status and message on 422', async () => {
      mock.onGet('/test').reply(422, { message: 'Validation failed' })
      await expect(httpClient.get('/test')).rejects.toMatchObject<Partial<ApiError>>({
        status: 422,
        message: 'Validation failed',
      })
    })

    it('throws ApiError with status 0 when no response', async () => {
      mock.onGet('/test').networkError()
      await expect(httpClient.get('/test')).rejects.toMatchObject<Partial<ApiError>>({
        status: 0,
      })
    })
  })
})
