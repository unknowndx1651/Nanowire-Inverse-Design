import { createContext, useContext } from 'react'
import type { DesignParameters, TargetRequirements } from '../lib/designLabTypes'
import type { OptimizationObjective } from '../lib/api/types'

export interface AppState {
  params: DesignParameters
  setParams: (params: DesignParameters) => void
  targets: TargetRequirements
  setTargets: (targets: TargetRequirements) => void
  objective: OptimizationObjective
  setObjective: (objective: OptimizationObjective) => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (ctx === null) {
    throw new Error('useAppState must be used inside <AppStateProvider>')
  }
  return ctx
}