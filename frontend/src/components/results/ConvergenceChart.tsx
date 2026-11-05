import { useMemo, useState } from 'react'
import { Tabs } from '../ui/Tabs'
import type {
  HistoryEntry,
  OptimizationObjective,
  OptimizeRequest,
} from '../../lib/api/types'
import { firstNewIndex, runningBest } from '../../lib/resultsAnalysis'
import {
  formatTick,
  linearScale,
  logScale,
  logTicks,
  niceLinearTicks,
  paddedLinearDomain,
  paddedLogDomain,
} from '../../lib/chartScales'


interface ConvergenceChartProps {
  history: HistoryEntry[]
  nNew: number
  request: OptimizeRequest
}

const W = 560
const H = 300
const ML = 56
const MR = 16
const MT = 12
const MB = 44

const AXIS_TITLE: Record<OptimizationObjective, string> = {
  sheet_resistance: 'Best Sheet Resistance (Ω/sq, log scale)',
  transparency: 'Best Optical Transparency (0–1)',
  strain_tolerance: 'Best Strain Tolerance',
}

type View = 'all' | 'run'

export function ConvergenceChart({ history, nNew, request }: ConvergenceChartProps) {
  const [view, setView] = useState<View>('all')

  const n = history.length
  const start = firstNewIndex(n, nNew)
  const series = useMemo(() => runningBest(history, request), [history, request])

  const canZoom = start > 0 && nNew > 0
  const viewFrom = view === 'run' && canZoom ? start : 0

  const visible: { index: number; value: number }[] = []
  for (let i = viewFrom; i < n; i++) {
    const v = series[i]
    if (v !== null) visible.push({ index: i, value: v })
  }

  const log = request.objective === 'sheet_resistance'
  const target =
    request.objective === 'sheet_resistance'
      ? request.max_sheet_resistance
      : request.objective === 'transparency'
        ? request.min_transparency
        : request.min_strain_tolerance
  const showTarget = target !== undefined && (!log || target > 0)

  const tabs = canZoom ? (
    <Tabs
      items={[
        { label: 'All evaluations', value: 'all' },
        { label: 'This run only', value: 'run' },
      ]}
      value={view}
      onChange={(v) => setView(v as View)}
    />
  ) : null

  if (visible.length === 0) {
    return (
      <div>
        {tabs}
        <p className="py-8 text-center text-sm text-muted">
          No evaluated design has met the targets in this view yet, so there is no best
          value to track.
        </p>
      </div>
    )
  }

  const values = visible.map((p) => p.value)
  if (showTarget) values.push(target as number)
  const vMin = Math.min(...values)
  const vMax = Math.max(...values)

  const xDomain = paddedLinearDomain(viewFrom + 1, n, 0.02)
  const x = linearScale(xDomain, [ML, W - MR])
  const yDomain = log ? paddedLogDomain(vMin, vMax) : paddedLinearDomain(vMin, vMax, 0.1)
  const y = log
    ? logScale(yDomain, [H - MB, MT])
    : linearScale(yDomain, [H - MB, MT])
  const xTicks = niceLinearTicks(xDomain[0], xDomain[1])
  const yTicks = log ? logTicks(yDomain[0], yDomain[1]) : niceLinearTicks(yDomain[0], yDomain[1])



  // Step path: the value holds until a better design is found
  let path = ''
  let prev: number | null = null
  for (const { index, value } of visible) {
    const px = x(index + 1)
    if (prev === null) {
      path += `M${px} ${y(value)}`
    } else if (value !== prev) {
      path += ` L${px} ${y(prev)} L${px} ${y(value)}`
    }
    prev = value
  }
  if (prev !== null) path += ` L${x(n)} ${y(prev)}`



  // Markers where the best value changed (or first became feasible)
  const improvements = visible.filter(({ index }) => index === 0 || series[index] !== series[index - 1])

  const showDivider = view === 'all' && start > 0 && start < n

  return (
    <div>
      {tabs && <div className="mb-3">{tabs}</div>}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Best feasible objective value found so far, by evaluation number"
      >
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={MT} y2={H - MB} className="stroke-border" strokeWidth={1} />
            <text x={x(t)} y={H - MB + 16} textAnchor="middle" className="fill-muted text-[10px] font-(family-name:--font-mono)">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text x={ML - 8} y={y(t) + 3} textAnchor="end" className="fill-muted text-[10px] font-(family-name:--font-mono)">
              {formatTick(t)}
            </text>
          </g>
        ))}

        <text x={(ML + W - MR) / 2} y={H - 6} textAnchor="middle" className="fill-muted text-[11px]">
          Evaluation number
        </text>
        <text
          transform={`translate(14 ${(MT + H - MB) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-muted text-[11px]"
        >
          {AXIS_TITLE[request.objective]}
        </text>

        {showDivider && (
          <g>
            <line
              x1={x(start + 0.5)} x2={x(start + 0.5)} y1={MT} y2={H - MB}
              className="stroke-muted" strokeWidth={1} strokeDasharray="2 3"
            />
            <text x={x(start + 0.5) + 4} y={MT + 10} className="fill-muted text-[10px]">
              this run →
            </text>
          </g>
        )}

        {showTarget && (
          <g>
            <line
              x1={ML} x2={W - MR} y1={y(target as number)} y2={y(target as number)}
              className="stroke-warning" strokeWidth={1} strokeDasharray="4 3"
            />
            <text
              x={W - MR - 4} y={y(target as number) - 4}
              textAnchor="end" className="fill-warning text-[10px] font-(family-name:--font-mono)"
            >
              target {log ? '≤' : '≥'} {formatTick(target as number)}
            </text>
          </g>
        )}

        <path d={path} fill="none" className="stroke-accent" strokeWidth={2} />
        {improvements.map(({ index, value }) => (
          <circle key={index} cx={x(index + 1)} cy={y(value)} r={3.5} className="fill-accent">
            <title>{`Evaluation ${index + 1}: best so far ${formatTick(value)}`}</title>
          </circle>
        ))}
      </svg>

    </div>
  )
}