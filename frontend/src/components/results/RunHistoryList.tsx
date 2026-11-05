import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import type { RunRecord } from '../../context/optimizationRunContext'
import { OBJECTIVE_LABEL, runOutcome } from '../../lib/runFormat'

interface RunHistoryListProps {
  runs: RunRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function RunHistoryList({ runs, selectedId, onSelect }: RunHistoryListProps) {
  if (runs.length === 0) {
    return (
      <EmptyState
        title="No completed runs yet"
        description="Runs finished in this browser session appear here."
      />
    )
  }

  const numbered = runs.map((run, i) => ({ run, number: i + 1 })).reverse()

  return (
    <div>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {numbered.map(({ run, number }) => {
          const selected = run.id === selectedId
          const outcome = runOutcome(run.results)
          const props = run.results.properties

          return (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => onSelect(run.id)}
                aria-current={selected ? 'true' : undefined}
                className={
                  'flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors duration-150 ' +
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ' +
                  (selected ? 'bg-accent-muted' : 'hover:bg-border/40')
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">Run {number}</span>
                  <Badge tone={outcome.tone}>{outcome.label}</Badge>
                </div>
                <span className="text-xs text-muted">{OBJECTIVE_LABEL[run.objective]}</span>
                <div className="flex items-center justify-between gap-2 text-xs font-(family-name:--font-mono) text-muted">
                  <span>
                    {props && props.sheet_resistance !== null
                      ? `${props.sheet_resistance.toFixed(1)} Ω/sq`
                      : '—'}
                    {' · '}
                    {props && props.transparency !== null ? props.transparency.toFixed(3) : '—'}
                  </span>
                  <span>
                    {run.results.n_new_simulations} sims 
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

    </div>
  )
}