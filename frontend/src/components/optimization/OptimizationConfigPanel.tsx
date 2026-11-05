import { Link } from 'react-router-dom'
import { Label } from '../ui/Label'
import { Select } from '../ui/Select'
import { Divider } from '../ui/Divider'
import { ScientificValue } from '../ui/ScientificValue'
import { useAppState } from '../../context/appStateContext'
import { PARAMETER_RANGES } from '../../lib/designLabTypes'
import type { OptimizationObjective } from '../../lib/api/types'

const OBJECTIVE_OPTIONS: { label: string; value: OptimizationObjective }[] = [
  { label: 'Minimize Sheet Resistance', value: 'sheet_resistance' },
  { label: 'Maximize Transparency', value: 'transparency' },
  { label: 'Maximize Strain Tolerance', value: 'strain_tolerance' },
]

const range = (r: { min: number; max: number }) => `${r.min} – ${r.max}`

interface OptimizationConfigPanelProps {
  disabled: boolean
}

export function OptimizationConfigPanel({ disabled }: OptimizationConfigPanelProps) {
  const { targets, objective, setObjective } = useAppState()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="objective">Optimization Objective</Label>
        <Select
          id="objective"
          value={objective}
          disabled={disabled}
          options={OBJECTIVE_OPTIONS}
          onChange={(e) => setObjective(e.target.value as OptimizationObjective)}
        />
      </div>

      <Divider />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Targets</h3>
          <Link
            to="/design"
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            Edit in Design Lab
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ScientificValue
            label="Max Sheet Resistance"
            value={targets.maxSheetResistance === '' ? 'Unconstrained' : `≤ ${targets.maxSheetResistance}`}
            unit={targets.maxSheetResistance === '' ? undefined : 'Ω/sq'}
          />
          <ScientificValue
            label="Min Optical Transparency"
            value={targets.minTransparency === '' ? 'Unconstrained' : `≥ ${targets.minTransparency}`}
            unit={targets.minTransparency === '' ? undefined : '(0–1)'}
          />
          <ScientificValue
            label="Strain Requirement"
            value={targets.minStrainTolerance === '' ? 'Unconstrained' : `≥ ${targets.minStrainTolerance}`}
          />
          <ScientificValue label="Simulation Budget" value={targets.budget} unit="simulations" />
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Search Space</h3>
        <div className="grid grid-cols-2 gap-4">
          <ScientificValue label="Nanowire Density" value={range(PARAMETER_RANGES.density)} />
          <ScientificValue label="Nanowire Length" value={range(PARAMETER_RANGES.lengthMean)} />
          <ScientificValue label="Nanowire Diameter" value={range(PARAMETER_RANGES.diameter)} />
          <ScientificValue label="Orientation" value={range(PARAMETER_RANGES.orientationS)} />
          <ScientificValue
            label="Junction Resistance"
            value={range(PARAMETER_RANGES.junctionResistance)}
            unit="Ω"
          />
        </div>
   
      </div>
    </div>
  )
}