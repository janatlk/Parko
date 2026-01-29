import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage'

type FailedQueueItem = {
  resolve: (value: string) => void
  reject: (reason?: unknown) => void
}

let isRefreshing = false
let failedQueue: FailedQueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
      return
    }
    if (!token) {
      p.reject(new Error('No token'))
      return
    }
    p.resolve(token)
  })
  failedQueue = []
}

const API_BASE_URL = '/api/v1/'

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
})

http.interceptors.response.use((response) => {
  const payload = response.data as unknown

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.status === 'success' && 'data' in record) {
      return {
        ...response,
        data: record.data,
      }
    }
  }

  return response
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const status = error.response?.status

    if (status !== 401 || originalRequest._retry) {
      if (status === 403) {
        // placeholder: UI can react to missing permissions
      }
      return Promise.reject(error)
    }

    const refresh = getRefreshToken()
    if (!refresh) {
      clearTokens()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`)
            resolve(http(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}auth/refresh/`,
        { refresh },
        {
          timeout: 30_000,
        },
      )

      const raw = refreshResponse.data as unknown
      const payload: unknown =
        raw && typeof raw === 'object' && (raw as Record<string, unknown>).status === 'success'
          ? (raw as Record<string, unknown>).data
          : raw

      const tokenRecord = (payload ?? {}) as Record<string, unknown>

      const newAccess: string | undefined = typeof tokenRecord.access === 'string' ? tokenRecord.access : undefined
      const newRefresh: string | undefined = typeof tokenRecord.refresh === 'string' ? tokenRecord.refresh : undefined

      if (!newAccess) {
        throw new Error('Refresh response has no access token')
      }

      setTokens({ access: newAccess, refresh: newRefresh })
      processQueue(null, newAccess)

      originalRequest.headers.set('Authorization', `Bearer ${newAccess}`)
      return http(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
