import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Divider } from '../components/ui/Divider'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { ProgressLabel } from '../components/ui/ScientificValue'
import { BestDesignPanel } from '../components/optimization/BestDesignPanel'
import { CandidateComparison } from '../components/results/CandidateComparison'
import { CandidateTable } from '../components/results/CandidateTable'
import { ConvergenceChart } from '../components/results/ConvergenceChart'
import { ResistanceTransparencyChart } from '../components/results/ResistanceTransparencyChart'
import { RunHistoryList } from '../components/results/RunHistoryList'
import { RunSummary } from '../components/results/RunSummary'
import {
  useOptimizationRun,
  type RunRecord,
} from '../context/optimizationRunContext'
import { findDesignIndex } from '../lib/resultsAnalysis'




const MAX_COMPARE = 3
const linkClass = 'text-sm text-accent underline-offset-2 hover:underline'
const subheading = 'mb-3 text-xs font-medium uppercase tracking-wide text-muted'

export function Results() {
  const { phase, progress, error, runs } = useOptimizationRun()

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ runId: string; indices: number[] }>({
    runId: '',
    indices: [],
  })

  // The run being viewed
  const run: RunRecord | null =
    runs.find((r) => r.id === selectedRunId) ?? runs[runs.length - 1] ?? null

  const bestIndex = useMemo(
    () => (run ? findDesignIndex(run.results.history, run.results.design) : null),
    [run],
  )


  const selectedIndices = run && selection.runId === run.id ? selection.indices : []

  const toggleCandidate = (index: number) => {
    if (!run) return
    setSelection((prev) => {
      const current = prev.runId === run.id ? prev.indices : []
      if (current.includes(index)) {
        return { runId: run.id, indices: current.filter((i) => i !== index) }
      }
      if (current.length >= MAX_COMPARE) return { runId: run.id, indices: current }
      return { runId: run.id, indices: [...current, index] }
    })
  }

  const inProgress = phase === 'starting' || phase === 'running'

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Results"
        description="Review and compare the outcomes of completed optimization runs."
      />

      {inProgress && (
        <div className="flex items-center justify-between gap-4 rounded-(--radius-md) border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge tone="accent">Run in progress</Badge>
            {progress && (
              <ProgressLabel current={progress.iteration} total={progress.budget} />
            )}
          </div>
          <Link to="/optimization" className={linkClass}>
            View progress →
          </Link>
        </div>
      )}

      {phase === 'failed' && (
        <div className="flex items-start justify-between gap-4 rounded-(--radius-md) border border-border px-4 py-3">
          <div className="flex items-start gap-3">
            <Badge tone="danger">Last run failed</Badge>
            <p className="text-sm text-muted">{error ?? 'The run could not be completed.'}</p>
          </div>
          <Link to="/optimization" className={linkClass}>
            Open Optimization →
          </Link>
        </div>
      )}

      {run === null ? (
        <EmptyState
          title="No completed runs yet"
          description="Results appear here once an optimization run has finished."
          action={
            <div className="flex items-center gap-4">
              <Link to="/design" className={linkClass}>
                Open Design Lab
              </Link>
              <Link to="/optimization" className={linkClass}>
                Start an optimization run
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-8">
          <div>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Run History (Session only)</h2>
            <RunHistoryList runs={runs} selectedId={run.id} onSelect={setSelectedRunId} />
          </div>

          <div key={run.id} className="flex min-w-0 flex-col gap-8">
            <RunSummary
              jobId={run.id}
              request={run.request}
              results={run.results}
              completedAt={run.completedAt}
            />

            <Divider />

            <div className="max-w-xl">
              <BestDesignPanel results={run.results} objective={run.objective} />
            </div>

            <Divider />

            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">Performance</h2>
              <div className="flex max-w-3xl flex-col gap-8">
                <div>
                  <h3 className={subheading}>Sheet resistance vs optical transparency</h3>
                  <ResistanceTransparencyChart
                    history={run.results.history}
                    nNew={run.results.n_new_simulations}
                    request={run.request}
                    bestIndex={bestIndex}
                  />
                </div>
                <div>
                  <h3 className={subheading}>Best feasible value so far</h3>
                  <ConvergenceChart
                    history={run.results.history}
                    nNew={run.results.n_new_simulations}
                    request={run.request}
                  />
                </div>
              </div>
            </section>

            <Divider />

            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Candidate Comparison
              </h2>
              <CandidateTable
                history={run.results.history}
                nNew={run.results.n_new_simulations}
                request={run.request}
                bestIndex={bestIndex}
                selected={selectedIndices}
                onToggle={toggleCandidate}
                maxSelected={MAX_COMPARE}
              />
              <div className="mt-6">
                <CandidateComparison
                  history={run.results.history}
                  nNew={run.results.n_new_simulations}
                  request={run.request}
                  indices={selectedIndices}
                  bestIndex={bestIndex}
                  onRemove={toggleCandidate}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}