export class ApiError extends Error {
  status: number
  code?: string
  details?: Array<{ field: string; message: string; code: string }>

  constructor(status: number, message: string, code?: string, details?: any[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  let res: Response
  try {
    res = await fetch(url, {
      credentials: 'include', // Ensures HTTP-only session cookies are sent & received
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...rest,
    })
  } catch (networkError: unknown) {
    throw new ApiError(
      503,
      `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running (npm run dev in my-backend).`,
      'BACKEND_OFFLINE'
    )
  }

  let data: any
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    let errorMessage = data?.error || data?.message
    if (!errorMessage) {
      if (res.status === 503) {
        errorMessage = 'Backend service or database is currently unavailable. Please verify Docker PostgreSQL and the backend server are running.'
      } else {
        errorMessage = `Request failed with status ${res.status}`
      }
    }
    throw new ApiError(res.status, errorMessage, data?.code, data?.details)
  }

  return data as T
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: 'GET', ...options })
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', ...options })
  },
}
