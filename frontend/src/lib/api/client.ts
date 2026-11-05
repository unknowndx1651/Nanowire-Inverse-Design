import {
  isOptimizationStatusResponse,
  isOptimizeResponse,
  isResultsResponse,
  isSimulateResponse,
} from './guards'
import type {
  OptimizeRequest,
  OptimizeResponse,
  OptimizationStatusResponse,
  ResultsResponse,
  SimulateRequest,
  SimulateResponse,
} from './types'


const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')

const DEFAULT_TIMEOUT_MS = 30_000

const SIMULATE_TIMEOUT_MS = 120_000



export type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'invalid'

export class ApiError extends Error {
  kind: ApiErrorKind
  status: number | null

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export function isTransient(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false
  if (e.kind === 'network' || e.kind === 'timeout') return true
  return e.kind === 'http' && e.status !== null && e.status >= 500
}


async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { loc?: unknown; msg?: unknown }
        const field = Array.isArray(first.loc) ? first.loc.slice(1).join('.') : ''
        const msg = String(first.msg ?? 'Invalid value')
        return field ? `${field}: ${msg}` : msg
      }
    }
  } catch {
    // body was not JSON
  }
  if (res.status >= 500) {
    return `Backend error (HTTP ${res.status}). Is the backend is running?`
  }
  return `Request failed with status ${res.status}`
}

interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

async function request<T>(
  path: string,
  isValid: (v: unknown) => v is T,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  const onCallerAbort = () => controller.abort()
  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', onCallerAbort, { once: true })
  }

  
  const interrupted = (): ApiError | null => {
    if (timedOut) {
      return new ApiError('timeout', 'The backend took too long to respond.')
    }
    if (options.signal?.aborted) return new ApiError('aborted', 'Request cancelled.')
    return null
  }

  try {
    let res: Response
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal })
    } catch {
      throw interrupted() ?? new ApiError('network', 'Could not reach the backend. Is it running?')
    }

    if (!res.ok) {
      throw new ApiError('http', await extractErrorMessage(res), res.status)
    }

    let body: unknown
    try {
      body = await res.json()
    } catch {
      throw interrupted() ?? new ApiError('invalid', 'The backend returned a response that is not valid JSON.')
    }

    if (!isValid(body)) {
      throw new ApiError('invalid', 'The backend returned a response in an unexpected format.')
    }
    return body
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onCallerAbort)
  }
}

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// POST /optimize
export function startOptimization(body: OptimizeRequest): Promise<OptimizeResponse> {
  return request('/optimize', isOptimizeResponse, jsonPost(body))
}

// GET /optimization/{job_id}
export function getOptimizationStatus(jobId: string): Promise<OptimizationStatusResponse> {
  return request(`/optimization/${encodeURIComponent(jobId)}`, isOptimizationStatusResponse)
}

// GET /results/{job_id}
export function getResults(jobId: string): Promise<ResultsResponse> {
  return request(`/results/${encodeURIComponent(jobId)}`, isResultsResponse)
}

// POST /simulate. Pass a signal to cancel the request.
export function simulateDesign(
  body: SimulateRequest,
  signal?: AbortSignal,
): Promise<SimulateResponse> {
  return request('/simulate', isSimulateResponse, jsonPost(body), {
    signal,
    timeoutMs: SIMULATE_TIMEOUT_MS,
  })
}