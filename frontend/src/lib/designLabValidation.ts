import type { DesignParameters } from './designLabTypes'
import { PARAMETER_RANGES } from './designLabTypes'
import type { SimulateRequest } from './api/types'

const FIELD_LABEL: Record<keyof DesignParameters, string> = {
  density: 'Nanowire Density',
  lengthMean: 'Nanowire Length',
  diameter: 'Nanowire Diameter',
  orientationS: 'Orientation',
  junctionResistance: 'Junction Resistance',
}



export function validateDesignParameters(params: DesignParameters): string[] {
  const errors: string[] = []
  for (const key of Object.keys(FIELD_LABEL) as (keyof DesignParameters)[]) {
    const value = params[key]
    const { min, max } = PARAMETER_RANGES[key]
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push(`${FIELD_LABEL[key]} must be between ${min} and ${max}.`)
    }
  }
  return errors
}

export function buildSimulateRequest(params: DesignParameters, seed: number): SimulateRequest {
  return {
    density: params.density,
    length_mean: params.lengthMean,
    diameter: params.diameter,
    orientation_S: params.orientationS,
    junction_resistance: params.junctionResistance,
    seed,
  }
}



export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}