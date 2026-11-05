import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={
        'h-10 w-full rounded-(--radius-md) border border-border bg-surface px-3 text-sm ' +
        'text-foreground placeholder:text-muted ' +
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
        'disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
      {...props}
    />
  )
}