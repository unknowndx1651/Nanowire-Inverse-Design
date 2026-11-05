import type { InputHTMLAttributes } from 'react'

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number | ''
  onChange: (value: number | '') => void
  unit?: string
}

export function NumberInput({
  value,
  onChange,
  unit,
  className = '',
  ...props
}: NumberInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? '' : Number(raw))
        }}
        className={
          'h-10 w-full rounded-(--radius-md) border border-border bg-transparent px-3 text-sm font-(family-name:--font-mono) ' +
          'text-foreground placeholder:text-muted placeholder:font-(family-name:--font-sans) ' +
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
          'disabled:opacity-50 disabled:pointer-events-none ' + '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ' +
          (unit ? 'pr-12 ' : '') +
          className
        }
        {...props}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-(family-name:--font-mono) text-muted">
          {unit}
        </span>
      )}
    </div>
  )
}