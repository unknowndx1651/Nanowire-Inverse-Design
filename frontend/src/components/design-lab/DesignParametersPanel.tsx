import { Slider } from '../ui/Slider'
import { NumberInput } from '../ui/NumberInput'
import { ScientificValue } from '../ui/ScientificValue'
import { Divider } from '../ui/Divider'
import type { DesignParameters } from '../../lib/designLabTypes'
import { PARAMETER_RANGES } from '../../lib/designLabTypes'

interface DesignParametersPanelProps {
  params: DesignParameters
  onChange: (params: DesignParameters) => void
}

function InlineFieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
  )
}

export function DesignParametersPanel({ params, onChange }: DesignParametersPanelProps) {
  const update = <K extends keyof DesignParameters>(key: K, value: number) =>
    onChange({ ...params, [key]: value })

  const handleNumberInput = (key: keyof DesignParameters, value: number | '') => {
  update(key, value === '' ? 0 : value)
}

  const aspectRatio = params.diameter > 0 ? params.lengthMean / params.diameter : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <InlineFieldLabel htmlFor="density">Nanowire Density</InlineFieldLabel>
          <NumberInput
            value={params.density}
            onChange={(v) => handleNumberInput('density', v)}
            min={PARAMETER_RANGES.density.min}
            max={PARAMETER_RANGES.density.max}
            step={PARAMETER_RANGES.density.step}
            className="w-24 h-8 text-right"
          />
        </div>
        <Slider
          id="density"
          value={params.density}
          min={PARAMETER_RANGES.density.min}
          max={PARAMETER_RANGES.density.max}
          step={PARAMETER_RANGES.density.step}
          unit="(sim. units)"
          onChange={(e) => update('density', Number(e.target.value))}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <InlineFieldLabel htmlFor="length">Nanowire Length</InlineFieldLabel>
          <NumberInput
            value={params.lengthMean}
            onChange={(v) => handleNumberInput('lengthMean', v)}
            min={PARAMETER_RANGES.lengthMean.min}
            max={PARAMETER_RANGES.lengthMean.max}
            step={PARAMETER_RANGES.lengthMean.step}
            className="w-24 h-8 text-right"
          />
        </div>
        <Slider
          id="length"
          value={params.lengthMean}
          min={PARAMETER_RANGES.lengthMean.min}
          max={PARAMETER_RANGES.lengthMean.max}
          step={PARAMETER_RANGES.lengthMean.step}
          unit="(sim. units)"
          onChange={(e) => update('lengthMean', Number(e.target.value))}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <InlineFieldLabel htmlFor="diameter">Nanowire Diameter</InlineFieldLabel>
          <NumberInput
            value={params.diameter}
            onChange={(v) => handleNumberInput('diameter', v)}
            min={PARAMETER_RANGES.diameter.min}
            max={PARAMETER_RANGES.diameter.max}
            step={PARAMETER_RANGES.diameter.step}
            className="w-24 h-8 text-right"
          />
        </div>
        <Slider
          id="diameter"
          value={params.diameter}
          min={PARAMETER_RANGES.diameter.min}
          max={PARAMETER_RANGES.diameter.max}
          step={PARAMETER_RANGES.diameter.step}
          unit="(sim. units)"
          onChange={(e) => update('diameter', Number(e.target.value))}
        />
      </div>

      <ScientificValue
        label="Aspect Ratio (derived)"
        value={aspectRatio.toFixed(2)}
      />

      <Divider />

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <InlineFieldLabel htmlFor="orientation">Orientation</InlineFieldLabel>
          <NumberInput
            value={params.orientationS}
            onChange={(v) => handleNumberInput('orientationS', v)}
            min={PARAMETER_RANGES.orientationS.min}
            max={PARAMETER_RANGES.orientationS.max}
            step={PARAMETER_RANGES.orientationS.step}
            className="w-24 h-8 text-right"
          />
        </div>
        <Slider
          id="orientation"
          value={params.orientationS}
          min={PARAMETER_RANGES.orientationS.min}
          max={PARAMETER_RANGES.orientationS.max}
          step={PARAMETER_RANGES.orientationS.step}
          onChange={(e) => update('orientationS', Number(e.target.value))}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <InlineFieldLabel htmlFor="junction">Junction Resistance</InlineFieldLabel>
          <NumberInput
            value={params.junctionResistance}
            onChange={(v) => handleNumberInput('junctionResistance', v)}
            min={PARAMETER_RANGES.junctionResistance.min}
            max={PARAMETER_RANGES.junctionResistance.max}
            step={PARAMETER_RANGES.junctionResistance.step}
            className="w-24 h-8 text-right"
          />
        </div>
        <Slider
          id="junction"
          value={params.junctionResistance}
          min={PARAMETER_RANGES.junctionResistance.min}
          max={PARAMETER_RANGES.junctionResistance.max}
          step={PARAMETER_RANGES.junctionResistance.step}
          unit="Ω"
          onChange={(e) => update('junctionResistance', Number(e.target.value))}
        />
      </div>
    </div>
  )
}