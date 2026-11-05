import type { ApiWireRow } from './api/types'
import type { DemoWire } from './demoNetwork'


// Port of wire_endpoints() from src/nanowire_generator.py:
//   dx = (length / 2) * cos(angle)
//   dy = (length / 2) * sin(angle)
//   endpoints = (xc - dx, yc - dy) and (xc + dx, yc + dy)
//
// The output reuses the DemoWire shape because that's simply the
// {x1, y1, x2, y2} segment type NetworkCanvas draws

export function wiresFromApi(network: ApiWireRow[]): DemoWire[] {
  return network.map(([xc, yc, angle, length]) => {
    const dx = (length / 2) * Math.cos(angle)
    const dy = (length / 2) * Math.sin(angle)
    return {
      x1: xc - dx,
      y1: yc - dy,
      x2: xc + dx,
      y2: yc + dy,
    }
  })
}