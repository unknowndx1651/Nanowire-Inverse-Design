import { Badge } from './Badge'

interface ScientificValueProps {
  label: string
  value: string | number
  unit?: string
}

export function ScientificValue({ label, value, unit }: ScientificValueProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-(family-name:--font-mono) text-foreground">
        {value}
        {unit && <span className="ml-1 text-muted">{unit}</span>}
      </span>
    </div>
  )
}

interface StatusValueProps {
  label: string
  status: boolean
  trueLabel?: string
  falseLabel?: string
}

export function StatusValue({
  label,
  status,
  trueLabel = 'YES',
  falseLabel = 'NO',
}: StatusValueProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <Badge tone={status ? 'success' : 'danger'}>
        {status ? trueLabel : falseLabel}
      </Badge>
    </div>
  )
}

interface ProgressLabelProps {
  current: number
  total: number
  noun?: string
}

export function ProgressLabel({ current, total, noun = 'Simulation' }: ProgressLabelProps) {
  return (
    <span className="text-sm font-(family-name:--font-mono) text-foreground">
      {noun} {current} / {total}
    </span>
  )
}