import type { OptimizationObjective, OptimizeRequest, ResultsDone } from './api/types'

export const OBJECTIVE_LABEL: Record<OptimizationObjective, string> = {
  sheet_resistance: 'Minimize Sheet Resistance',
  transparency: 'Maximize Transparency',
  strain_tolerance: 'Maximize Strain Tolerance',
}

export interface TargetLine {
  label: string
  value: string
  unit?: string
}



export function describeTargets(request: OptimizeRequest): TargetLine[] {
  const r = request.max_sheet_resistance
  const t = request.min_transparency
  const s = request.min_strain_tolerance
  return [
    {
      label: 'Maximum Sheet Resistance',
      value: r === undefined ? 'Unconstrained' : `≤ ${r}`,
      unit: r === undefined ? undefined : 'Ω/sq',
    },
    {
      label: 'Minimum Optical Transparency',
      value: t === undefined ? 'Unconstrained' : `≥ ${t}`,
      unit: t === undefined ? undefined : '(0–1)',
    },
    {
      label: 'Strain Requirement',
      value: s === undefined ? 'Unconstrained' : `≥ ${s}`,
    },
  ]
}

export type OutcomeTone = 'success' | 'warning' | 'neutral'



export function runOutcome(results: ResultsDone): { label: string; tone: OutcomeTone } {
  if (results.design === null) return { label: 'No design found', tone: 'neutral' }
  return results.feasible
    ? { label: 'Meets all targets', tone: 'success' }
    : { label: 'Closest miss', tone: 'warning' }
}

// The moment this browser received the results (client clock)
export function formatCompletedAt(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}