// Small, dependency-free helpers for the hand-written SVG charts

export type NumberRange = [number, number]

// Maps a value from a data domain onto a pixel range
export function linearScale(domain: NumberRange, range: NumberRange): (v: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (v) => r0 + ((v - d0) / span) * (r1 - r0)
}

// Same thing on a log10 axis. Every value and both domain ends must be > 0
export function logScale(domain: NumberRange, range: NumberRange): (v: number) => number {
  const l0 = Math.log10(domain[0])
  const l1 = Math.log10(domain[1])
  const span = l1 - l0 || 1
  const [r0, r1] = range
  return (v) => r0 + ((Math.log10(v) - l0) / span) * (r1 - r0)
}

// Widen a data range slightly so points don't sit on the plot edge
export function paddedLinearDomain(min: number, max: number, fraction = 0.05): NumberRange {
  if (max === min) {
    const d = Math.abs(min) * 0.05 || 0.05
    return [min - d, max + d]
  }
  const pad = (max - min) * fraction
  return [min - pad, max + pad]
}

export function paddedLogDomain(min: number, max: number, factor = 1.25): NumberRange {
  return [min / factor, max * factor]
}

// Round-number tick positions inside [min, max]
export function niceLinearTicks(min: number, max: number, target = 5): number[] {
  if (!(max > min)) return [min]
  const rawStep = (max - min) / target
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / magnitude
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * magnitude

  const start = Math.ceil(min / step) * step
  const count = Math.floor((max - start) / step + 1e-9)
  const ticks: number[] = []
  for (let i = 0; i <= count; i++) {
    ticks.push(Number((start + i * step).toPrecision(12)))
  }
  return ticks
}

// Ticks at 1, 2 and 5 per decade; powers of ten only if that gets crowded
export function logTicks(min: number, max: number): number[] {
  const ticks: number[] = []
  const kMin = Math.floor(Math.log10(min))
  const kMax = Math.ceil(Math.log10(max))
  for (let k = kMin; k <= kMax; k++) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** k
      if (v >= min && v <= max) ticks.push(v)
    }
  }
  if (ticks.length > 8) {
    return ticks.filter((v) => Math.abs(Math.log10(v) - Math.round(Math.log10(v))) < 1e-9)
  }
  return ticks.length >= 2 ? ticks : [min, max]
}

// Compact tick/label text: 3 significant figures, exponent form at the extremes
export function formatTick(v: number): string {
  const abs = Math.abs(v)
  if (abs !== 0 && (abs >= 100000 || abs < 0.001)) return v.toExponential(0)
  return String(Number(v.toPrecision(3)))
}