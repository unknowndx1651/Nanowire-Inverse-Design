import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, simulateDesign } from '../lib/api/client'
import {
  buildSimulateRequest,
  randomSeed,
  validateDesignParameters,
} from '../lib/designLabValidation'
import { wiresFromApi } from '../lib/networkFromApi'
import type { DemoWire } from '../lib/demoNetwork'
import type { DesignParameters } from '../lib/designLabTypes'
import type { ResultProperties } from '../lib/api/types'


export interface SimulationResult {
  properties: ResultProperties
  wires: DemoWire[]
  nWires: number
  seed: number
  params: DesignParameters 
}


export type SimulationPhase = 'idle' | 'loading' | 'ready' | 'error'


export function useSimulation() {
  const [phase, setPhase] = useState<SimulationPhase>('idle')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const controllerRef = useRef<AbortController | null>(null)
  const latestRequest = useRef(0)

  const cancelInFlight = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const run = useCallback(
    async (params: DesignParameters) => {
      const problems = validateDesignParameters(params)
      setValidationErrors(problems)
      if (problems.length > 0) return

      cancelInFlight()
      const controller = new AbortController()
      controllerRef.current = controller
      const requestId = ++latestRequest.current

      setPhase('loading')
      setResult(null)
      setError(null)

      const seed = randomSeed()
      try {
        const res = await simulateDesign(buildSimulateRequest(params, seed), controller.signal)

        if (requestId !== latestRequest.current) return
        setResult({
          properties: res.properties,
          wires: wiresFromApi(res.network),
          nWires: res.n_wires,
          seed,
          params,
        })
        setPhase('ready')
      } catch (e) {
        if (requestId !== latestRequest.current) return
        if (e instanceof ApiError && e.kind === 'aborted') return
        setError(e instanceof Error ? e.message : 'Unknown error')
        setPhase('error')
      }
    },
    [cancelInFlight],
  )

  const reset = useCallback(() => {
    latestRequest.current += 1
    cancelInFlight()
    setPhase('idle')
    setResult(null)
    setError(null)
    setValidationErrors([])
  }, [cancelInFlight])


  useEffect(() => {
    return () => {
      latestRequest.current += 1
      cancelInFlight()
    }
  }, [cancelInFlight])

  
  return { phase, result, error, validationErrors, run, reset }
}