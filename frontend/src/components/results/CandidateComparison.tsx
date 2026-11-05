import { useMemo, type CSSProperties } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { LoadingState } from '../ui/LoadingState'
import { NetworkCanvas } from '../design-lab/NetworkCanvas'
import {
  useCandidateNetworks,
  type CandidateNetworkState,
} from '../../hooks/useCandidateNetworks'
import { firstNewIndex, isFeasible } from '../../lib/resultsAnalysis'
import type { HistoryEntry, OptimizeRequest } from '../../lib/api/types'


interface CandidateComparisonProps {
  history: HistoryEntry[]
  nNew: number
  request: OptimizeRequest
  indices: number[] // selected positions in history
  bestIndex: number | null
  onRemove: (index: number) => void
}

type Direction = 'min' | 'max'

interface MetricRow {
  label: string
  unit?: string
  values: (number | null)[]
  digits: number
  best?: Direction
}

const fmt = (v: number | null, digits: number) => (v === null ? '—' : v.toFixed(digits))


function bestColumns(values: (number | null)[], direction: Direction): Set<number> {
  const present = values.filter((v): v is number => v !== null)
  if (present.length < 2) return new Set()
  const target = direction === 'min' ? Math.min(...present) : Math.max(...present)
  if (present.every((v) => v === target)) return new Set()
  const out = new Set<number>()
  values.forEach((v, i) => {
    if (v === target) out.add(i)
  })
  return out
}


function NetworkSlot({ state, onRetry }: { state: CandidateNetworkState; onRetry: () => void }) {
  if (state.status === 'ready') return <NetworkCanvas wires={state.wires} />

  const frame =
    'flex aspect-square w-full items-center justify-center rounded-(--radius-md) border border-border px-4 text-center'

  if (state.status === 'loading') {
    return (
      <div className={frame}>
        <LoadingState label="Rebuilding network" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className={frame}>
        <ErrorState
          title="Could not rebuild network"
          description={state.message}
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }
  return (
    <div className={frame}>
      <p className="text-sm text-muted">{state.reason}</p>
    </div>
  )
}

function MetricGridRow({ row, template }: { row: MetricRow; template: CSSProperties }) {
  const bestCols = row.best ? bestColumns(row.values, row.best) : new Set<number>()
  return (
    <div
      className="grid items-baseline gap-22 border-b border-border py-2 last:border-b-0"
      style={template}
    >
      <span className="text-xs text-muted">
        {row.label}
        {row.unit && <span className="ml-1">{row.unit}</span>}
      </span>
      {row.values.map((v, i) => (
        <span
          key={i}
          className={
            'text-sm font-(family-name:--font-mono) ' +
            (bestCols.has(i) ? 'font-semibold text-accent' : 'text-foreground')
          }
        >
          {fmt(v, row.digits)}
        </span>
      ))}
    </div>
  )
}

export function CandidateComparison({
  history,
  nNew,
  request,
  indices,
  bestIndex,
  onRemove,
}: CandidateComparisonProps) {
  const entries = useMemo(() => indices.map((i) => history[i]), [indices, history])
  const { stateFor, retry } = useCandidateNetworks(entries)

  if (indices.length === 0) {
    return (
      <EmptyState
        title="No candidates selected"
        description="Select up to three designs in the table above to compare them side by side."
      />
    )
  }

  const start = firstNewIndex(history.length, nNew)
  const template: CSSProperties = {
    gridTemplateColumns: `150px repeat(${indices.length}, minmax(0, 1fr))`,
  }

  const aspect = entries.map((e) =>
    e.length_mean !== null && e.diameter !== null && e.diameter > 0
      ? e.length_mean / e.diameter
      : null,
  )

  const propertyRows: MetricRow[] = [
    { label: 'Sheet Resistance', unit: 'Ω/sq', values: entries.map((e) => e.sheet_resistance), digits: 2, best: 'min' },
    { label: 'Optical Transparency', unit: '(0–1)', values: entries.map((e) => e.transparency), digits: 3, best: 'max' },
    { label: 'Strain Tolerance', values: entries.map((e) => e.strain_tolerance), digits: 3, best: 'max' },
  ]

  const parameterRows: MetricRow[] = [
    { label: 'Nanowire Density', values: entries.map((e) => e.density), digits: 4 },
    { label: 'Nanowire Length', values: entries.map((e) => e.length_mean), digits: 2 },
    { label: 'Nanowire Diameter', values: entries.map((e) => e.diameter), digits: 3 },
    { label: 'Aspect Ratio (derived)', values: aspect, digits: 2 },
    { label: 'Orientation', values: entries.map((e) => e.orientation_S), digits: 3 },
    { label: 'Junction Resistance', unit: 'Ω', values: entries.map((e) => e.junction_resistance), digits: 1 },
  ]

  const sectionTitle = 'mb-1 mt-6 text-xs font-medium uppercase tracking-wide text-muted'

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* candidate headers */}
        <div className="grid gap-4" style={template}>
          <div />
          {indices.map((index, col) => {
            const feasible = isFeasible(entries[col], request)
            return (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Evaluation {index + 1}</p>
                    <p className="text-xs text-muted">{index >= start ? 'This run' : 'Baseline'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                    Remove
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {index === bestIndex && <Badge tone="accent">Best design</Badge>}
                  <Badge tone={feasible ? 'success' : 'warning'}>
                    {feasible ? 'Meets all targets' : 'Targets not met'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* networks */}
        <div className="mt-4 grid gap-4" style={template}>
          <div />
          {indices.map((index, col) => (
            <NetworkSlot
              key={index}
              state={stateFor(entries[col])}
              onRetry={() => retry(entries[col])}
            />
          ))}
        </div>

        {/* properties */}
        <h4 className={sectionTitle}>Evaluated properties</h4>
        {propertyRows.map((row) => (
          <MetricGridRow key={row.label} row={row} template={template} />
        ))}
        <div className="grid items-center gap-22 border-b border-border py-2" style={template}>
          <span className="text-xs text-muted">Spanning Cluster</span>
          {entries.map((e, i) => (
            <span key={i}>
              <Badge tone={e.percolates ? 'success' : 'danger'}>{e.percolates ? 'YES' : 'NO'}</Badge>
            </span>
          ))}
        </div>

        {/* parameters */}
        <h4 className={sectionTitle}>Design parameters</h4>
        {parameterRows.map((row) => (
          <MetricGridRow key={row.label} row={row} template={template} />
        ))}
        
      </div>
    </div>
  )
}