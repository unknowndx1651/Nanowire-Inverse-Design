import { SectionHeader } from '../components/ui/SectionHeader'
import { Divider } from '../components/ui/Divider'
import { OptimizationConfigPanel } from '../components/optimization/OptimizationConfigPanel'
import { OptimizationRunControl } from '../components/optimization/OptimizationRunControl'
import { OptimizationProgressPanel } from '../components/optimization/OptimizationProgressPanel'
import { BestDesignPanel } from '../components/optimization/BestDesignPanel'
import { useAppState } from '../context/appStateContext'
import { buildOptimizeRequest } from '../lib/api/buildRequest'
import { Link } from 'react-router-dom'
import { useOptimizationRun } from '../context/optimizationRunContext'


// const WORKFLOW = [
//   'Design',
//   'Physics Simulation',
//   'Gaussian Process',
//   'Bayesian Optimization',
//   'Next Candidate',
// ]

export function Optimization() {
  const { targets, objective } = useAppState()
  const { phase, jobId, progress, results, error, currentRequest, startRun, clearCurrent } =
    useOptimizationRun()



  const busy = phase === 'starting' || phase === 'running'
  const handleStart = () => {
    startRun(buildOptimizeRequest(objective, targets))
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Optimization"
        description="Run and monitor Bayesian Optimization over the nanowire design space."
      />



      <div className="grid grid-cols-[320px_1fr] gap-8">
        <div className="flex flex-col gap-6">
          <OptimizationRunControl phase={phase} onStart={handleStart} onClear={clearCurrent} />          {phase === 'done' && (
            <Link to="/results" className="text-sm text-accent underline-offset-2 hover:underline">
              View in Results →
            </Link>
          )}
          <Divider />
          <OptimizationConfigPanel disabled={busy} />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Progress</h2>
            <OptimizationProgressPanel
              phase={phase}
              jobId={jobId}
              progress={progress}
              error={error}
            />
          </div>

          {phase === 'done' && results !== null && (
            <>
              <Divider />
              <BestDesignPanel results={results} objective={currentRequest?.objective ?? objective} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}