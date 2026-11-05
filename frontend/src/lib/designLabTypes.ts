/*
Mirrors the real backend shapes (simulator.py's simulate_design args,
and app.py's OptimizeRequest) so this state can be wired to the actual
API later without redesigning it
*/


export interface DesignParameters {
  density: number
  lengthMean: number
  diameter: number
  orientationS: number
  junctionResistance: number
}


export interface TargetRequirements {
  maxSheetResistance: number | ''
  minTransparency: number | ''
  minStrainTolerance: number | ''
  budget: number
}


/*
Real bounds from src/simulator.py PARAM_RANGES. Units are simulation
units unless noted — the project has not defined physical units
(e.g. μm, nm) for density/length/diameter
*/
export const PARAMETER_RANGES = {
  density: { min: 0.02, max: 0.3, step: 0.01 },
  lengthMean: { min: 4, max: 15, step: 0.5 },
  diameter: { min: 0.1, max: 0.5, step: 0.01 },
  orientationS: { min: 0, max: 1, step: 0.05 },
  junctionResistance: { min: 10, max: 500, step: 10 },
} as const


export const DEFAULT_DESIGN_PARAMETERS: DesignParameters = {
  density: 0.15,
  lengthMean: 8,
  diameter: 0.2,
  orientationS: 0,
  junctionResistance: 100,
}

export const DEFAULT_TARGET_REQUIREMENTS: TargetRequirements = {
  maxSheetResistance: '',
  minTransparency: '',
  minStrainTolerance: '',
  budget: 50,
}

// Real bound from app.py's OptimizeRequest: Field(50, ge=1, le=200)
export const BUDGET_RANGE = { min: 1, max: 200, step: 1 } as const