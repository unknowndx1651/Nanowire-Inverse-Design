import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={
          'h-10 w-full appearance-none rounded-(--radius-md) border border-border bg-surface/0 px-3 pr-8 text-sm ' +          '[&_option]:bg-surface [&_option]:text-foreground ' +
          'text-foreground ' +
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
          'disabled:opacity-50 disabled:pointer-events-none ' +
          className
        }
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}