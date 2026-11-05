import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { OptimizationPhase } from '../../hooks/useOptimizationJob'

interface OptimizationRunControlProps {
  phase: OptimizationPhase
  onStart: () => void
  onClear: () => void
}

const PHASE_BADGE: Record<
  OptimizationPhase,
  { label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' }
> = {
  idle: { label: 'Idle', tone: 'neutral' },
  starting: { label: 'Starting', tone: 'accent' },
  running: { label: 'Running', tone: 'accent' },
  done: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}


export function OptimizationRunControl({ phase, onStart, onClear }: OptimizationRunControlProps) {
  const busy = phase === 'starting' || phase === 'running'
  const finished = phase === 'done' || phase === 'failed'
  const badge = PHASE_BADGE[phase]

  const buttonLabel =
    phase === 'starting' ? 'Starting…' :
    phase === 'running' ? 'Running…' :
    finished ? 'Start New Run' :
    'Start Optimization'

    
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Run status</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onStart} disabled={busy}>
          {buttonLabel}
        </Button>
        {finished && (
          <Button variant="ghost" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}