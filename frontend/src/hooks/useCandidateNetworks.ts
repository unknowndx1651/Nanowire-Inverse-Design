import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateDesign } from '../lib/api/client'
import { wiresFromApi } from '../lib/networkFromApi'
import type { DemoWire } from '../lib/demoNetwork'
import type { HistoryEntry, SimulateRequest } from '../lib/api/types'

export type CandidateNetworkState =
  | { status: 'loading' }
  | { status: 'ready'; wires: DemoWire[] }
  | { status: 'error'; message: string }
  | { status: 'unavailable'; reason: string }


/*
A network can only be rebuilt exactly when the seed and all five
parameters are known
*/
function toRequest(entry: HistoryEntry): SimulateRequest | null {
  const { seed, density, length_mean, diameter, orientation_S, junction_resistance } = entry
  if (
    seed === null ||
    density === null ||
    length_mean === null ||
    diameter === null ||
    orientation_S === null ||
    junction_resistance === null
  ) {
    return null
  }
  return { density, length_mean, diameter, orientation_S, junction_resistance, seed }
}

function keyOf(r: SimulateRequest): string {
  return [r.seed, r.density, r.length_mean, r.diameter, r.orientation_S, r.junction_resistance].join('|')
}

function unavailableReason(entry: HistoryEntry): string {
  return entry.seed === null
    ? 'This design has no stored seed, so its network cannot be rebuilt exactly.'
    : 'This design is missing parameters, so its network cannot be rebuilt.'
}

export function useCandidateNetworks(entries: HistoryEntry[]) {
  const [cache, setCache] = useState<Record<string, CandidateNetworkState>>({})
  const requested = useRef<Set<string>>(new Set())

  const load = useCallback((req: SimulateRequest, key: string) => {
    requested.current.add(key)
    simulateDesign(req)
      .then((res) =>
        setCache((prev) => ({
          ...prev,
          [key]: { status: 'ready', wires: wiresFromApi(res.network) },
        })),
      )
      .catch((e: unknown) =>
        setCache((prev) => ({
          ...prev,
          [key]: { status: 'error', message: e instanceof Error ? e.message : 'Unknown error' },
        })),
      )
  }, [])

  useEffect(() => {
    for (const entry of entries) {
      const req = toRequest(entry)
      if (req === null) continue
      const key = keyOf(req)
      if (!requested.current.has(key)) load(req, key)
    }
  }, [entries, load])

  const retry = useCallback(
    (entry: HistoryEntry) => {
      const req = toRequest(entry)
      if (req === null) return
      const key = keyOf(req)
      setCache((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      load(req, key)
    },
    [load],
  )

  const stateFor = useCallback(
    (entry: HistoryEntry): CandidateNetworkState => {
      const req = toRequest(entry)
      if (req === null) return { status: 'unavailable', reason: unavailableReason(entry) }
      return cache[keyOf(req)] ?? { status: 'loading' }
    },
    [cache],
  )

  return { stateFor, retry }
}