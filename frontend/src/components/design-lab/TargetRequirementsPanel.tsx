import { Label } from '../ui/Label'
import { NumberInput } from '../ui/NumberInput'
import { Slider } from '../ui/Slider'
import { Divider } from '../ui/Divider'
import type { TargetRequirements } from '../../lib/designLabTypes'
import { BUDGET_RANGE } from '../../lib/designLabTypes'

interface TargetRequirementsPanelProps {
  targets: TargetRequirements
  onChange: (targets: TargetRequirements) => void
}

export function TargetRequirementsPanel({ targets, onChange }: TargetRequirementsPanelProps) {
  const update = <K extends keyof TargetRequirements>(
    key: K,
    value: TargetRequirements[K],
  ) => onChange({ ...targets, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="max-resistance">Maximum Sheet Resistance</Label>
        <NumberInput
          id="max-resistance"
          value={targets.maxSheetResistance}
          onChange={(v) => update('maxSheetResistance', v)}
          unit="Ω/sq"
          placeholder="Unconstrained"
        />
        
      </div>

      <div>
        <Label htmlFor="min-transparency">Minimum Optical Transparency</Label>
        <NumberInput
          id="min-transparency"
          value={targets.minTransparency}
          onChange={(v) => update('minTransparency', v)}
          unit="(0–1)"
          placeholder="Unconstrained"
        />
        
      </div>

      <div>
        <Label htmlFor="min-strain">Strain Requirement (optional)</Label>
        <NumberInput
          id="min-strain"
          value={targets.minStrainTolerance}
          onChange={(v) => update('minStrainTolerance', v)}
          placeholder="Unconstrained"
        />
        
      </div>

      <Divider />

      <div>
        <Label htmlFor="budget">Simulation Budget</Label>
        <Slider
          id="budget"
          value={targets.budget}
          min={BUDGET_RANGE.min}
          max={BUDGET_RANGE.max}
          step={BUDGET_RANGE.step}
          unit="simulations"
          onChange={(e) => update('budget', Number(e.target.value))}
        />
      </div>
    </div>
  )
}