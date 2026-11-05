import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { OptimizationRunContext, type RunRecord } from './optimizationRunContext'
import { useOptimizationJob } from '../hooks/useOptimizationJob'
import type { OptimizeRequest, ResultsDone } from '../lib/api/types'


export function OptimizationRunProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [currentRequest, setCurrentRequest] = useState<OptimizeRequest | null>(null)
  const requestRef = useRef<OptimizeRequest | null>(null)

  const handleComplete = useCallback((jobId: string, results: ResultsDone) => {
    const request = requestRef.current
    if (request === null) return
    setRuns((prev) =>
      prev.some((r) => r.id === jobId)
        ? prev
        : [
            ...prev,
            { id: jobId, objective: request.objective, request, results, completedAt: Date.now() },
          ],
    )
  }, [])

  const { phase, jobId, progress, results, error, start, reset } =
    useOptimizationJob(handleComplete)

  const startRun = useCallback(
    (request: OptimizeRequest) => {
      requestRef.current = request
      setCurrentRequest(request)
      start(request)
    },
    [start],
  )

  const clearCurrent = useCallback(() => {
    requestRef.current = null
    setCurrentRequest(null)
    reset()
  }, [reset])

  const value = useMemo(
    () => ({
      phase, jobId, progress, results, error, currentRequest, runs, startRun, clearCurrent,
    }),
    [phase, jobId, progress, results, error, currentRequest, runs, startRun, clearCurrent],
  )

  return <OptimizationRunContext.Provider value={value}>{children}</OptimizationRunContext.Provider>
}