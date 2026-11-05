import { useMemo } from 'react'
import { Badge } from '../ui/Badge'
import { Checkbox } from '../ui/Checkbox'
import { EmptyState } from '../ui/EmptyState'
import type { HistoryEntry, OptimizationObjective, OptimizeRequest } from '../../lib/api/types'
import { firstNewIndex, rankFeasible } from '../../lib/resultsAnalysis'

interface CandidateTableProps {
  history: HistoryEntry[]
  nNew: number
  request: OptimizeRequest
  bestIndex: number | null
  selected: number[] 
  onToggle: (index: number) => void
  maxSelected: number
  maxListed?: number
}

interface Row {
  index: number
  rank: number | null 
}

const fmt = (v: number | null, digits: number) => (v === null ? '—' : v.toFixed(digits))

const OBJECTIVE_COLUMN: Record<OptimizationObjective, 'resistance' | 'transparency' | 'strain'> = {
  sheet_resistance: 'resistance',
  transparency: 'transparency',
  strain_tolerance: 'strain',
}

export function CandidateTable({
  history,
  nNew,
  request,
  bestIndex,
  selected,
  onToggle,
  maxSelected,
  maxListed = 10,
}: CandidateTableProps) {

  const { rows } = useMemo(() => {
    const ranked = rankFeasible(history, request)
    const list: Row[] = ranked.slice(0, maxListed).map((index, i) => ({ index, rank: i + 1 }))
    if (bestIndex !== null && !list.some((r) => r.index === bestIndex)) {
      list.unshift({ index: bestIndex, rank: null })
    }
    return { rows: list, feasibleCount: ranked.length }
  }, [history, request, bestIndex, maxListed])


  if (rows.length === 0) {
    return (
      <EmptyState
        title="No candidates to compare"
        description="No evaluated design met every target and no best design was found."
      />
    )
  }

  const start = firstNewIndex(history.length, nNew)
  const highlight = OBJECTIVE_COLUMN[request.objective]
  const atLimit = selected.length >= maxSelected

  const headClass = (key: typeof highlight) =>
    'px-3 py-2 text-right font-medium ' + (highlight === key ? 'text-accent' : '')
  const cellClass = (key: typeof highlight) =>
    'px-3 py-2 text-right font-(family-name:--font-mono) ' +
    (highlight === key ? 'font-medium text-foreground' : 'text-muted')

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 text-left font-medium">Rank</th>
              <th className="px-3 py-2 text-left font-medium">Evaluation</th>
              <th className="px-3 py-2 text-left font-medium">Source</th>
              <th className={headClass('resistance')}>Sheet Resistance (Ω/sq)</th>
              <th className={headClass('transparency')}>Transparency (0–1)</th>
              <th className={headClass('strain')}>Strain Tolerance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ index, rank }) => {
              const e = history[index]
              const isSelected = selected.includes(index)
              const isBest = index === bestIndex
              return (
                <tr
                  key={index}
                  className={
                    'border-b border-border last:border-b-0 ' + (isSelected ? 'bg-accent-muted' : '')
                  }
                >
                  <td className="px-3 py-2">
                    <Checkbox
                      aria-label={`Compare evaluation ${index + 1}`}
                      checked={isSelected}
                      disabled={!isSelected && atLimit}
                      onChange={() => onToggle(index)}
                    />
                  </td>
                  <td className="px-3 py-2 font-(family-name:--font-mono) text-muted">
                    {rank ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-(family-name:--font-mono) text-foreground">
                    <span className="flex items-center gap-2">
                      {index + 1}
                      {isBest && <Badge tone={rank === null ? 'warning' : 'success'}>Best</Badge>}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">{index >= start ? 'This run' : 'Baseline'}</td>
                  <td className={cellClass('resistance')}>{fmt(e.sheet_resistance, 2)}</td>
                  <td className={cellClass('transparency')}>{fmt(e.transparency, 3)}</td>
                  <td className={cellClass('strain')}>{fmt(e.strain_tolerance, 3)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}