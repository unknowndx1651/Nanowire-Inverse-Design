import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { ErrorState } from '../ui/ErrorState'
import { HelperText } from '../ui/HelperText'
import { ProgressLabel, ScientificValue } from '../ui/ScientificValue'
import type { OptimizationPhase } from '../../hooks/useOptimizationJob'
import type { JobProgress } from '../../lib/api/types'

interface OptimizationProgressPanelProps {
  phase: OptimizationPhase
  jobId: string | null
  progress: JobProgress | null
  error: string | null
}

export function OptimizationProgressPanel({
  phase,
  jobId,
  progress,
  error,
}: OptimizationProgressPanelProps) {
  if (phase === 'idle') {
    return (
      <EmptyState
        title="No run in progress"
        description="Choose an objective and start an optimization run. Progress will appear here."
      />
    )
  }

  if (phase === 'starting') {
    return <LoadingState label="Submitting optimization job" />
  }

  if (phase === 'failed') {
    return (
      <ErrorState
        title="OPTIMIZATION FAILED"
        description={error ?? 'The run could not be completed.'}
      />
    )
  }


  const iteration = progress?.iteration ?? 0
  const budget = progress?.budget ?? 0
  const percent = budget > 0 ? Math.min(100, (iteration / budget) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ProgressLabel current={iteration} total={budget} />
        <span className="text-sm font-(family-name:--font-mono) text-muted">
          {percent.toFixed(0)}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={iteration}
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {jobId && <ScientificValue label="Job ID" value={jobId} />}

      {phase === 'running' && (
        <HelperText>
          Each iteration fits the Gaussian Process surrogate and runs one physics
          simulation.
        </HelperText>
      )}

    </div>
  )
}