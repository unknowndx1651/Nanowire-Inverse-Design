import type {
  ApiWireRow,
  HistoryEntry,
  JobProgress,
  OptimizeResponse,
  OptimizationStatusResponse,
  ResultDesign,
  ResultProperties,
  ResultsResponse,
  SimulateResponse,
} from './types'

type Rec = Record<string, unknown>

const isRecord = (v: unknown): v is Rec =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isNumOrNull = (v: unknown): v is number | null => v === null || isNum(v)
const isStrOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'

function isProgress(v: unknown): v is JobProgress {
  return isRecord(v) && isNum(v.iteration) && isNum(v.budget)
}

function isResultDesign(v: unknown): v is ResultDesign {
  return (
    isRecord(v) &&
    isNum(v.density) &&
    isNum(v.length_mean) &&
    isNum(v.diameter) &&
    isNum(v.orientation_S) &&
    isNum(v.junction_resistance)
  )
}

function isResultProperties(v: unknown): v is ResultProperties {
  return (
    isRecord(v) &&
    isNumOrNull(v.sheet_resistance) &&
    isNumOrNull(v.transparency) &&
    isNumOrNull(v.strain_tolerance) &&
    typeof v.percolates === 'boolean'
  )
}

// [x_center, y_center, angle, length, diameter, wire_id]
function isWireRow(v: unknown): v is ApiWireRow {
  return Array.isArray(v) && v.length === 6 && v.every(isNum)
}

function isNetwork(v: unknown): v is ApiWireRow[] {
  return Array.isArray(v) && v.every(isWireRow)
}

function isHistoryEntry(v: unknown): v is HistoryEntry {
  return (
    isRecord(v) &&
    isNumOrNull(v.density) &&
    isNumOrNull(v.length_mean) &&
    isNumOrNull(v.diameter) &&
    isNumOrNull(v.orientation_S) &&
    isNumOrNull(v.junction_resistance) &&
    isNumOrNull(v.sheet_resistance) &&
    isNumOrNull(v.transparency) &&
    isNumOrNull(v.strain_tolerance) &&
    isNumOrNull(v.seed) &&
    typeof v.percolates === 'boolean'
  )
}

// POST /optimize
export function isOptimizeResponse(v: unknown): v is OptimizeResponse {
  return isRecord(v) && typeof v.job_id === 'string'
}

// GET /optimization/{job_id}
export function isOptimizationStatusResponse(v: unknown): v is OptimizationStatusResponse {
  return (
    isRecord(v) &&
    (v.status === 'running' || v.status === 'done' || v.status === 'failed') &&
    isProgress(v.progress) &&
    isStrOrNull(v.error)
  )
}

// GET /results/{job_id}: three shapes, told apart by `status`
export function isResultsResponse(v: unknown): v is ResultsResponse {
  if (!isRecord(v)) return false

  if (v.status === 'running') return isProgress(v.progress)
  if (v.status === 'failed') return isStrOrNull(v.error)

  if (v.status === 'done') {
    return (
      typeof v.feasible === 'boolean' &&
      (v.design === null || isResultDesign(v.design)) &&
      (v.properties === null || isResultProperties(v.properties)) &&
      (v.network === null || isNetwork(v.network)) &&
      isNum(v.n_new_simulations) &&
      Array.isArray(v.history) &&
      v.history.every(isHistoryEntry)
    )
  }
  return false
}

// POST /simulate
export function isSimulateResponse(v: unknown): v is SimulateResponse {
  return (
    isRecord(v) &&
    isResultProperties(v.properties) &&
    isNetwork(v.network) &&
    isNum(v.n_wires)
  )
}