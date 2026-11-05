import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'
import { ScientificValue } from '../ui/ScientificValue'
import { summarizeRun } from '../../lib/resultsAnalysis'
import {
  OBJECTIVE_LABEL,
  describeTargets,
  formatCompletedAt,
  runOutcome,
} from '../../lib/runFormat'
import type { OptimizeRequest, ResultsDone } from '../../lib/api/types'

interface RunSummaryProps {
  jobId: string
  request: OptimizeRequest
  results: ResultsDone
  completedAt: number
}

export function RunSummary({ jobId, request, results, completedAt }: RunSummaryProps) {
  const outcome = runOutcome(results)
  const counts = summarizeRun(results.history, results.n_new_simulations, request)
  const targets = describeTargets(request)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Optimization Summary</h2>
          <p className="mt-0.5 text-xs text-muted">{OBJECTIVE_LABEL[request.objective]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success">Completed</Badge>
          <Badge tone={outcome.tone}>{outcome.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {targets.map((t) => (
          <ScientificValue key={t.label} label={t.label} value={t.value} unit={t.unit} />
        ))}
      </div>

      <Divider />

      <div className="grid grid-cols-4 gap-4">
        <ScientificValue
          label="Simulations Run"
          value={`${results.n_new_simulations} / ${request.budget}`}
        />
        <ScientificValue label="Baseline Designs" value={counts.baselineCount} />
        <ScientificValue
          label="New Designs Connected"
          value={`${counts.percolatingNew} / ${counts.newCount}`}
        />
        <ScientificValue
          label="Designs Meeting Targets"
          value={`${counts.feasibleNew} new · ${counts.feasibleTotal} total`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ScientificValue label="Job ID" value={jobId} />
        <ScientificValue label="Results Received" value={formatCompletedAt(completedAt)} />
      </div>

    </div>
  )
}