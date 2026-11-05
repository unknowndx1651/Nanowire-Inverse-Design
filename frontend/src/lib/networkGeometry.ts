import type { DemoWire } from './demoNetwork'
import { DEMO_DOMAIN_SIZE } from './demoNetwork'

export interface Intersection {
  wireA: number
  wireB: number
  x: number
  y: number
}

// Direct port of segments_intersect() from src/geometry.py
function segmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
): { hit: boolean; x?: number; y?: number } {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-10) return { hit: false }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { hit: true, x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }
  }
  return { hit: false }
}

// Direct port of find_all_intersections() from src/geometry.py
// O(n^2) brute force, same as the Python version
export function findAllIntersections(wires: DemoWire[]): Intersection[] {
  const out: Intersection[] = []
  for (let i = 0; i < wires.length; i++) {
    const a = wires[i]
    for (let j = i + 1; j < wires.length; j++) {
      const b = wires[j]
      const result = segmentsIntersect(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2)
      if (result.hit) {
        out.push({ wireA: i, wireB: j, x: result.x!, y: result.y! })
      }
    }
  }
  return out
}

// Union-find used to compute connected components the same way
// src/graph_model.py's networkx-based connected_components does
class UnionFind {
  parent: number[]
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
  }
  find(i: number): number {
    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i])
    return this.parent[i]
  }
  union(i: number, j: number) {
    const ri = this.find(i)
    const rj = this.find(j)
    if (ri !== rj) this.parent[ri] = rj
  }
}

export interface SpanningResult {
  spans: boolean
  componentWireIndices: Set<number> | null
}


// Mirrors has_spanning_cluster() / build_network_graph()'s electrode
// logic from src/graph_model.py: a wire touching the left edge of the
// domain and a wire touching the right edge, connected through any chain
// of intersections, means the network spans left-to-right
export function computeSpanningStructure(
  wires: DemoWire[],
  intersections: Intersection[],
  domainSize: number = DEMO_DOMAIN_SIZE,
): SpanningResult {
  if (wires.length === 0) return { spans: false, componentWireIndices: null }

  const uf = new UnionFind(wires.length)
  for (const { wireA, wireB } of intersections) {
    uf.union(wireA, wireB)
  }

  const touchesLeft = wires.map((w) => Math.min(w.x1, w.x2) <= 0)
  const touchesRight = wires.map((w) => Math.max(w.x1, w.x2) >= domainSize)

  const leftRoots = new Set(
    wires.map((_, i) => i).filter((i) => touchesLeft[i]).map((i) => uf.find(i)),
  )

  for (let i = 0; i < wires.length; i++) {
    if (touchesRight[i] && leftRoots.has(uf.find(i))) {
      const root = uf.find(i)
      const componentWireIndices = new Set(
        wires.map((_, idx) => idx).filter((idx) => uf.find(idx) === root),
      )
      return { spans: true, componentWireIndices }
    }
  }

  return { spans: false, componentWireIndices: null }
}