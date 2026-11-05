import type { HTMLAttributes, ReactNode } from 'react'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Panel({ className = '', children, ...props }: PanelProps) {
  return (
    <div
      className={
        'rounded-(--radius-lg) border border-border bg-surface p-5 ' + className
      }
      {...props}
    >
      {children}
    </div>
  )
}