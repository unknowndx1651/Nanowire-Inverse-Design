import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { HelperText } from '../components/ui/HelperText'
import { LoadingState } from '../components/ui/LoadingState'
import { ScientificValue, StatusValue } from '../components/ui/ScientificValue'
import { SectionHeader } from '../components/ui/SectionHeader'
import { DesignParametersPanel } from '../components/design-lab/DesignParametersPanel'
import { NetworkCanvas } from '../components/design-lab/NetworkCanvas'
import { NetworkStatsRow } from '../components/design-lab/NetworkStatsRow'
import { TargetRequirementsPanel } from '../components/design-lab/TargetRequirementsPanel'
import { useAppState } from '../context/appStateContext'
import { useSimulation } from '../hooks/useSimulation'
import {
  DEFAULT_DESIGN_PARAMETERS,
  DEFAULT_TARGET_REQUIREMENTS,
  type DesignParameters,
} from '../lib/designLabTypes'

const PARAM_KEYS: (keyof DesignParameters)[] = [
  'density',
  'lengthMean',
  'diameter',
  'orientationS',
  'junctionResistance',
]

const sameParams = (a: DesignParameters, b: DesignParameters) =>
  PARAM_KEYS.every((k) => a[k] === b[k])

const fmt = (v: number | null, digits: number) => (v === null ? '—' : v.toFixed(digits))

const frame =
  'flex aspect-square w-full items-center justify-center rounded-(--radius-md) ' +
  'border border-dashed border-border px-6 text-center text-sm text-muted'

export function DesignLab() {
  const { params, setParams, targets, setTargets } = useAppState()
  const { phase, result, error, validationErrors, run, reset } = useSimulation()

  const loading = phase === 'loading'
  const stale = phase === 'ready' && result !== null && !sameParams(result.params, params)

  const handleGenerate = () => {
    void run(params)
  }

  const handleReset = () => {
    setParams(DEFAULT_DESIGN_PARAMETERS)
    setTargets(DEFAULT_TARGET_REQUIREMENTS)
    reset()
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        
        title="Design Lab"
        description="Configure and explore nanowire designs."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Simulating…' : 'Generate Candidate'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-[280px_1fr_280px] gap-6">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Design Parameters</h2>
          <DesignParametersPanel params={params} onChange={setParams} />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Nanowire Network</h2>
            {loading && <Badge tone="accent">Simulating</Badge>}
            {phase === 'ready' && <Badge tone="neutral">Physics simulator</Badge>}
          </div>

          {phase === 'idle' && (
            <div className={frame}>
              Click "Generate Candidate" to simulate a network with the current design
              parameters.
            </div>
          )}

          {loading && (
            <div className={frame}>
              <LoadingState label="Running physics simulation" />
            </div>
          )}

          {phase === 'error' && (
            <div className={frame}>
              <ErrorState
                title="SIMULATION FAILED"
                description={error ?? undefined}
                action={
                  <Button variant="secondary" size="sm" onClick={handleGenerate}>
                    Try again
                  </Button>
                }
              />
            </div>
          )}

          {phase === 'ready' && result !== null && (
            <>
              <NetworkCanvas wires={result.wires} />
              <div className="mt-3">
                <NetworkStatsRow
                  wires={result.wires}
                  spanningLabel="Left–right connection"
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <ScientificValue
                  label="Sheet Resistance"
                  value={fmt(result.properties.sheet_resistance, 2)}
                  unit={result.properties.sheet_resistance === null ? undefined : 'Ω/sq'}
                />
                <ScientificValue
                  label="Optical Transparency"
                  value={fmt(result.properties.transparency, 3)}
                  unit="(0–1)"
                />
                <ScientificValue
                  label="Strain Tolerance"
                  value={fmt(result.properties.strain_tolerance, 3)}
                />
                <StatusValue label="Spanning Cluster" status={result.properties.percolates} />
              </div>


              {stale && (
                <HelperText tone="error">
                  The design parameters have changed since this simulation. Generate again
                  to update.
                </HelperText>
              )}
            </>
          )}

          {validationErrors.length > 0 && (
            <div className="mt-3">
              {validationErrors.map((msg) => (
                <HelperText key={msg} tone="error">
                  {msg}
                </HelperText>
              ))}
            </div>
          )}



        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Target Requirements</h2>
          <TargetRequirementsPanel targets={targets} onChange={setTargets} />
        </div>
      </div>
    </div>
  )
}