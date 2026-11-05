import type { InputHTMLAttributes } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  unit,
  className = '',
  ...props
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-(family-name:--font-mono) text-foreground">
          {value}
          {unit && <span className="ml-1 text-muted">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        className={
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
          'disabled:opacity-50 disabled:pointer-events-none ' +
          className
        }
        {...props}
      />
      <div className="flex items-center justify-between text-xs text-muted font-(family-name:--font-mono)">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}