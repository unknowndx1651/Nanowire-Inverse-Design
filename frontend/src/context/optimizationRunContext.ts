import { createContext, useContext } from 'react'
import type { OptimizationPhase } from '../hooks/useOptimizationJob'
import type {
  JobProgress,
  OptimizationObjective,
  OptimizeRequest,
  ResultsDone,
} from '../lib/api/types'


export interface RunRecord {
  id: string
  objective: OptimizationObjective
  request: OptimizeRequest
  results: ResultsDone
  completedAt: number
}


export interface OptimizationRunState {
  phase: OptimizationPhase
  jobId: string | null
  progress: JobProgress | null
  results: ResultsDone | null
  error: string | null
  currentRequest: OptimizeRequest | null
  runs: RunRecord[]
  startRun: (request: OptimizeRequest) => void
  clearCurrent: () => void
}

export const OptimizationRunContext = createContext<OptimizationRunState | null>(null)

export function useOptimizationRun(): OptimizationRunState {
  const ctx = useContext(OptimizationRunContext)
  if (ctx === null) {
    throw new Error('useOptimizationRun must be used inside <OptimizationRunProvider>')
  }
  return ctx
}