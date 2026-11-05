import type { TargetRequirements } from '../designLabTypes'
import type { OptimizationObjective, OptimizeRequest } from './types'

/*
Turns the Design Lab targets into the exact body /optimize expects
Empty target fields are left out entirely, which the backend reads as
unconstrained (Optional[float] = None in app.py).
*/

export function buildOptimizeRequest(
  objective: OptimizationObjective,
  targets: TargetRequirements,
): OptimizeRequest {
  const body: OptimizeRequest = { objective, budget: targets.budget }
  if (targets.maxSheetResistance !== '') body.max_sheet_resistance = targets.maxSheetResistance
  if (targets.minTransparency !== '') body.min_transparency = targets.minTransparency
  if (targets.minStrainTolerance !== '') body.min_strain_tolerance = targets.minStrainTolerance
  return body
}