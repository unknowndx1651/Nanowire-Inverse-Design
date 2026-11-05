import { ScientificValue, StatusValue } from '../ui/ScientificValue'
import type { DemoWire } from '../../lib/demoNetwork'
import { findAllIntersections, computeSpanningStructure } from '../../lib/networkGeometry'
import { DEMO_DOMAIN_SIZE } from '../../lib/demoNetwork'

interface NetworkStatsRowProps {
  wires: DemoWire[]
  spanningLabel?: string
}

export function NetworkStatsRow({ wires, spanningLabel = 'Spanning Connection (demo geometry)', }: NetworkStatsRowProps) {
  const intersections = findAllIntersections(wires)
  const spanning = computeSpanningStructure(wires, intersections, DEMO_DOMAIN_SIZE)

  return (
    <div className="flex items-center gap-6">
      <ScientificValue label="Visible Wires" value={wires.length} />
      <ScientificValue label="Intersections" value={intersections.length} />
      <StatusValue label={spanningLabel} status={spanning.spans} />
    </div>
  )
}