import type {
  HistoryEntry,
  OptimizationObjective,
  OptimizeRequest,
  ResultDesign,
} from './api/types'


export function firstNewIndex(historyLength: number, nNew: number): number {
  return Math.max(0, historyLength - nNew)
}

// Same rule as check_feasibility() in src/pareto.py: the design must
// percolate, have a finite sheet resistance, and satisfy every target
// that was set
export function isFeasible(entry: HistoryEntry, request: OptimizeRequest): boolean {
  if (!entry.percolates || entry.sheet_resistance === null) return false

  if (
    request.max_sheet_resistance !== undefined &&
    entry.sheet_resistance > request.max_sheet_resistance
  ) {
    return false
  }
  if (
    request.min_transparency !== undefined &&
    (entry.transparency === null || entry.transparency < request.min_transparency)
  ) {
    return false
  }
  if (
    request.min_strain_tolerance !== undefined &&
    (entry.strain_tolerance === null || entry.strain_tolerance < request.min_strain_tolerance)
  ) {
    return false
  }
  return true
}

// The three objective names are also the property names on a history row.
export function objectiveValue(
  entry: HistoryEntry,
  objective: OptimizationObjective,
): number | null {
  return entry[objective]
}

// Sheet resistance is minimized; transparency and strain tolerance are maximized.
export function isBetter(
  candidate: number,
  incumbent: number,
  objective: OptimizationObjective,
): boolean {
  return objective === 'sheet_resistance' ? candidate < incumbent : candidate > incumbent
}

// Best feasible objective value seen so far, one entry per evaluated
// design in evaluation order. null until the first feasible design
export function runningBest(
  history: HistoryEntry[],
  request: OptimizeRequest,
): (number | null)[] {
  let best: number | null = null
  return history.map((entry) => {
    const value = objectiveValue(entry, request.objective)
    if (value !== null && isFeasible(entry, request)) {
      if (best === null || isBetter(value, best, request.objective)) best = value
    }
    return best
  })
}

const PARAM_KEYS = [
  'density',
  'length_mean',
  'diameter',
  'orientation_S',
  'junction_resistance',
] as const

function sameNumber(a: number | null, b: number): boolean {
  return a !== null && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))
}

// Locates the best design (returned separately by /results) inside the
// history by matching its five parameters. Returns null if it isn't found
export function findDesignIndex(
  history: HistoryEntry[],
  design: ResultDesign | null,
): number | null {
  if (design === null) return null
  const index = history.findIndex((entry) =>
    PARAM_KEYS.every((key) => sameNumber(entry[key], design[key])),
  )
  return index === -1 ? null : index
}

// Indices of all feasible designs, best first for the run's objective
export function rankFeasible(history: HistoryEntry[], request: OptimizeRequest): number[] {
  const ranked: { index: number; value: number }[] = []
  history.forEach((entry, index) => {
    const value = objectiveValue(entry, request.objective)
    if (value !== null && isFeasible(entry, request)) ranked.push({ index, value })
  })

  const minimize = request.objective === 'sheet_resistance'
  ranked.sort((a, b) => {
    if (a.value === b.value) return a.index - b.index
    return minimize ? a.value - b.value : b.value - a.value
  })
  return ranked.map((r) => r.index)
}

export interface RunSummary {
  baselineCount: number
  newCount: number
  percolatingNew: number
  feasibleNew: number
  feasibleTotal: number
}

// Plain counts over the history, for the summary section
export function summarizeRun(
  history: HistoryEntry[],
  nNew: number,
  request: OptimizeRequest,
): RunSummary {
  const start = firstNewIndex(history.length, nNew)
  const added = history.slice(start)
  return {
    baselineCount: start,
    newCount: added.length,
    percolatingNew: added.filter((e) => e.percolates).length,
    feasibleNew: added.filter((e) => isFeasible(e, request)).length,
    feasibleTotal: history.filter((e) => isFeasible(e, request)).length,
  }
}