import { useMemo } from 'react'
import type { HistoryEntry, OptimizeRequest } from '../../lib/api/types'
import { firstNewIndex } from '../../lib/resultsAnalysis'
import {
  formatTick,
  linearScale,
  logScale,
  logTicks,
  niceLinearTicks,
  paddedLinearDomain,
  paddedLogDomain,
} from '../../lib/chartScales'

interface ResistanceTransparencyChartProps {
  history: HistoryEntry[]
  nNew: number
  request: OptimizeRequest
  bestIndex: number | null
}

const W = 560
const H = 340
const ML = 56
const MR = 16
const MT = 12
const MB = 44

interface Point {
  index: number 
  t: number
  r: number
  isNew: boolean
}

export function ResistanceTransparencyChart({
  history,
  nNew,
  request,
  bestIndex,
}: ResistanceTransparencyChartProps) {

  const { points } = useMemo(() => {
    const start = firstNewIndex(history.length, nNew)
    const pts: Point[] = []
    history.forEach((e, index) => {
      if (e.percolates && e.sheet_resistance !== null && e.sheet_resistance > 0 && e.transparency !== null) {
        pts.push({ index, t: e.transparency, r: e.sheet_resistance, isNew: index >= start })
      }
    })
    return { points: pts, excluded: history.length - pts.length }
  }, [history, nNew])

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No evaluated design has a measurable sheet resistance, so there is nothing to plot.
      </p>
    )
  }

  const tVals = points.map((p) => p.t)
  if (request.min_transparency !== undefined) tVals.push(request.min_transparency)
  const rVals = points.map((p) => p.r)
  if (request.max_sheet_resistance !== undefined && request.max_sheet_resistance > 0) {
    rVals.push(request.max_sheet_resistance)
  }

  const xDomain = paddedLinearDomain(Math.min(...tVals), Math.max(...tVals))
  const yDomain = paddedLogDomain(Math.min(...rVals), Math.max(...rVals))
  const x = linearScale(xDomain, [ML, W - MR])
  const y = logScale(yDomain, [H - MB, MT])
  const xTicks = niceLinearTicks(xDomain[0], xDomain[1])
  const yTicks = logTicks(yDomain[0], yDomain[1])

  const baseline = points.filter((p) => !p.isNew)
  const added = points.filter((p) => p.isNew)
  const best = bestIndex === null ? undefined : points.find((p) => p.index === bestIndex)

  const label = (p: Point) =>
    `Evaluation ${p.index + 1}${p.isNew ? ' (this run)' : ' (baseline)'}\n` +
    `Transparency ${p.t.toFixed(3)}\nSheet resistance ${p.r.toFixed(2)} Ω/sq`

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Scatter plot of sheet resistance against optical transparency for every evaluated design"
      >


        {/* gridlines and tick labels */}
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



        {/* axis titles */}
        <text x={(ML + W - MR) / 2} y={H - 6} textAnchor="middle" className="fill-muted text-[11px]">
          Optical Transparency (0–1)
        </text>
        <text
          transform={`translate(14 ${(MT + H - MB) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-muted text-[11px]"
        >
          Sheet Resistance (Ω/sq, log scale)
        </text>



        {/* target limits */}
        {request.max_sheet_resistance !== undefined && request.max_sheet_resistance > 0 && (
          <g>
            <line
              x1={ML} x2={W - MR}
              y1={y(request.max_sheet_resistance)} y2={y(request.max_sheet_resistance)}
              className="stroke-warning" strokeWidth={1} strokeDasharray="4 3"
            />
            <text
              x={W - MR - 4} y={y(request.max_sheet_resistance) - 4}
              textAnchor="end" className="fill-warning text-[10px] font-(family-name:--font-mono)"
            >
              ≤ {formatTick(request.max_sheet_resistance)} Ω/sq
            </text>
          </g>
        )}
        {request.min_transparency !== undefined && (
          <g>
            <line
              x1={x(request.min_transparency)} x2={x(request.min_transparency)}
              y1={MT} y2={H - MB}
              className="stroke-warning" strokeWidth={1} strokeDasharray="4 3"
            />
            <text
              x={x(request.min_transparency) + 4} y={MT + 10}
              className="fill-warning text-[10px] font-(family-name:--font-mono)"
            >
              ≥ {formatTick(request.min_transparency)}
            </text>
          </g>
        )}



        {/* designs: baseline first, this run on top */}
        {baseline.map((p) => (
          <circle key={p.index} cx={x(p.t)} cy={y(p.r)} r={2.5} className="fill-muted" fillOpacity={0.45}>
            <title>{label(p)}</title>
          </circle>
        ))}
        {added.map((p) => (
          <circle key={p.index} cx={x(p.t)} cy={y(p.r)} r={3.5} className="fill-accent">
            <title>{label(p)}</title>
          </circle>
        ))}
        {best && (
          <circle cx={x(best.t)} cy={y(best.r)} r={7} className="fill-none stroke-success" strokeWidth={2}>
            <title>{`Best design\n${label(best)}`}</title>
          </circle>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted opacity-50" /> Baseline dataset
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" /> This run
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-success" /> Best design
        </span>
        {(request.max_sheet_resistance !== undefined || request.min_transparency !== undefined) && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-warning" /> Target limit
          </span>
        )}
      </div>
    
    </div>
  )
}