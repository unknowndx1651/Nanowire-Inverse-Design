// Mirrors the real request/response shapes in app.py exactly.
// Nothing here is assumed: every field below exists in the backend code.

export type OptimizationObjective =
  | 'sheet_resistance'
  | 'transparency'
  | 'strain_tolerance'

// POST /optimize  (app.py: OptimizeRequest)
// Target fields are Optional in the backend, Omitted = unconstrained
export interface OptimizeRequest {
  objective: OptimizationObjective
  max_sheet_resistance?: number
  min_transparency?: number
  min_strain_tolerance?: number
  budget: number
}

// POST /optimize response
export interface OptimizeResponse {
  job_id: string
}

export type JobStatus = 'running' | 'done' | 'failed'

export interface JobProgress {
  iteration: number
  budget: number
}

// GET /optimization/{job_id}
export interface OptimizationStatusResponse {
  status: JobStatus
  progress: JobProgress
  error: string | null
}

// Design parameters as returned by /results (snake_case, as in app.py)
export interface ResultDesign {
  density: number
  length_mean: number
  diameter: number
  orientation_S: number
  junction_resistance: number
}

// Properties as returned by /results. The backend converts inf/NaN to
// null, so any numeric field can be null.
export interface ResultProperties {
  sheet_resistance: number | null
  transparency: number | null
  strain_tolerance: number | null
  percolates: boolean
}

// One row per wire, matching simulator.py's array layout:
// [x_center, y_center, angle, length, diameter, wire_id]
export type ApiWireRow = [number, number, number, number, number, number]

export interface HistoryEntry {
  density: number | null
  length_mean: number | null
  diameter: number | null
  orientation_S: number | null
  junction_resistance: number | null
  sheet_resistance: number | null
  transparency: number | null
  strain_tolerance: number | null
  seed: number | null
  percolates: boolean
}
// GET /results/{job_id}: three distinct shapes depending on job status
export interface ResultsRunning {
  status: 'running'
  progress: JobProgress
}

export interface ResultsFailed {
  status: 'failed'
  error: string | null
}

export interface ResultsDone {
  status: 'done'
  feasible: boolean
  design: ResultDesign | null 
  properties: ResultProperties | null
  network: ApiWireRow[] | null
  n_new_simulations: number
  history: HistoryEntry[]
}

// POST /simulate  (app.py: SimulateRequest)
export interface SimulateRequest {
  density: number
  length_mean: number
  diameter: number
  orientation_S: number
  junction_resistance: number
  seed?: number
}

// POST /simulate response
export interface SimulateResponse {
  properties: ResultProperties
  network: ApiWireRow[]
  n_wires: number
}
export type ResultsResponse = ResultsRunning | ResultsFailed | ResultsDone