import { useState, useMemo, type ReactNode } from 'react'
import { AppStateContext } from './appStateContext'
import {
  DEFAULT_DESIGN_PARAMETERS,
  DEFAULT_TARGET_REQUIREMENTS,
} from '../lib/designLabTypes'
import type { OptimizationObjective } from '../lib/api/types'


export function AppStateProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState(DEFAULT_DESIGN_PARAMETERS)
  const [targets, setTargets] = useState(DEFAULT_TARGET_REQUIREMENTS)
  const [objective, setObjective] = useState<OptimizationObjective>('sheet_resistance')
  const value = useMemo(
    () => ({ params, setParams, targets, setTargets, objective, setObjective }),
    [params, targets, objective],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}