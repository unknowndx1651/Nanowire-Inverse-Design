import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'
import { EmptyState } from '../ui/EmptyState'
import { HelperText } from '../ui/HelperText'
import { ScientificValue, StatusValue } from '../ui/ScientificValue'
import type { OptimizationObjective, ResultsDone } from '../../lib/api/types'


const fmt = (v: number | null, digits: number) => (v === null ? '—' : v.toFixed(digits))

interface BestDesignPanelProps {
  results: ResultsDone
  objective: OptimizationObjective
}

export function BestDesignPanel({ results,  }: BestDesignPanelProps) {
  const { design, properties, feasible } = results

  if (design === null || properties === null) {
    return (
      <EmptyState
        title="No design found"
        description="No evaluated design produced a connected network. Try a larger simulation budget or looser targets."
      />
    )
  }

  const aspectRatio = design.diameter > 0 ? design.length_mean / design.diameter : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Best Design</h3>
          {/* <p className="mt-0.5 text-xs text-muted">{OBJECTIVE_LABEL[objective]}</p> */}
        </div>
        <Badge tone={feasible ? 'success' : 'warning'}>
          {feasible ? 'Meets all targets' : 'Closest miss — targets not met'}
        </Badge>
      </div>

      {!feasible && (
        <HelperText>
          No evaluated design met every target. This is the design that came closest.
          That means none of the designs tried met them, not that the targets are
          physically impossible.
        </HelperText>
      )}

      <div>
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Verified properties
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <ScientificValue
            label="Sheet Resistance"
            value={fmt(properties.sheet_resistance, 2)}
            unit={properties.sheet_resistance === null ? undefined : 'Ω/sq'}
          />
          <ScientificValue label="Optical Transparency" value={fmt(properties.transparency, 3)} unit="(0–1)" />
          <ScientificValue label="Strain Tolerance" value={fmt(properties.strain_tolerance, 3)} />
          <StatusValue label="Spanning Cluster" status={properties.percolates} />
        </div>
      </div>

      <Divider />

      <div>
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Design parameters
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <ScientificValue label="Nanowire Density" value={design.density.toFixed(4)} />
          <ScientificValue label="Nanowire Length" value={design.length_mean.toFixed(2)} />
          <ScientificValue label="Nanowire Diameter" value={design.diameter.toFixed(3)} />
          <ScientificValue label="Aspect Ratio (derived)" value={aspectRatio.toFixed(2)} />
          <ScientificValue label="Orientation" value={design.orientation_S.toFixed(3)} />
          <ScientificValue
            label="Junction Resistance"
            value={design.junction_resistance.toFixed(1)}
            unit="Ω"
          />
        </div>

      </div>

    </div>
  )
}