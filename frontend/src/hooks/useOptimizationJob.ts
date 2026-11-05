import {
  ApiError,
  isTransient,
  startOptimization,
  getOptimizationStatus,
  getResults,
} from '../lib/api/client'
import type {
  JobProgress,
  OptimizeRequest,
  ResultsDone,
} from '../lib/api/types'
import { useCallback, useEffect, useRef, useState } from 'react'


// idle     : nothing started yet
// starting : POST /optimize in flight, no job_id yet
// running  : job_id known, polling /optimization/{job_id}
// done     : results fetched successfully
// failed   : the request, the job, or the polling failed (see `error`)


export type OptimizationPhase = 'idle' | 'starting' | 'running' | 'done' | 'failed'

const POLL_INTERVAL_MS = 1500

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error'
}

const MAX_TRANSIENT_POLL_FAILURES = 3



function describePollError(e: unknown): string {
  if (e instanceof ApiError && e.kind === 'http' && e.status === 404) {
    return 'The backend no longer has this job. A backend restart clears running jobs. Start a new run.'
  }
  if (isTransient(e)) {
    return `${toMessage(e)} Contact was lost while the run was in progress. The run may still be going on the server.`
  }
  return toMessage(e)
}



export function useOptimizationJob(
  onComplete?: (jobId: string, results: ResultsDone) => void,
) {
  const [phase, setPhase] = useState<OptimizationPhase>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState<JobProgress | null>(null)
  const [results, setResults] = useState<ResultsDone | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const start = useCallback(async (body: OptimizeRequest) => {
    setPhase('starting')
    setError(null)
    setResults(null)
    setProgress({ iteration: 0, budget: body.budget })
    try {
      const { job_id } = await startOptimization(body)
      setJobId(job_id)
      setPhase('running')
    } catch (e) {
      setError(toMessage(e))
      setPhase('failed')
    }
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setJobId(null)
    setProgress(null)
    setResults(null)
    setError(null)
  }, [])


  useEffect(() => {
    if (jobId === null || phase !== 'running') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let failures = 0

    const tick = async () => {
      try {
        const status = await getOptimizationStatus(jobId)
        if (cancelled) return
        setProgress(status.progress)

        if (status.status === 'failed') {
          setError(status.error ?? 'The optimization job failed.')
          setPhase('failed')
          return
        }

        if (status.status === 'done') {
          const res = await getResults(jobId)
          if (cancelled) return
          if (res.status === 'done') {
            setResults(res)
            setPhase('done')
            onCompleteRef.current?.(jobId, res)
            return
          }
          if (res.status === 'failed') {
            setError(res.error ?? 'The optimization job failed.')
            setPhase('failed')
            return
          }
          
        }
      } catch (e) {
        if (cancelled) return
        if (isTransient(e) && failures < MAX_TRANSIENT_POLL_FAILURES) {
          failures += 1
          timer = setTimeout(tick, POLL_INTERVAL_MS)
          return
        }
        setError(describePollError(e))
        setPhase('failed')
        return
      }

      failures = 0
      timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    tick()

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [jobId, phase])

  return { phase, jobId, progress, results, error, start, reset }
}