import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Checkbox({ label, className = '', id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        id={id}
        className={
          'size-4 shrink-0 rounded-(--radius-sm) border border-border bg-surface ' +
          'accent-accent cursor-pointer ' +
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
          'disabled:opacity-50 disabled:pointer-events-none ' +
          className
        }
        {...props}
      />
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  )
}