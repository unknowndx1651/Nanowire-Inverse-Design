import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-border/40 text-foreground',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  accent: 'bg-accent-muted text-accent',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={
        'inline-flex items-center rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium ' +
        toneStyles[tone]
      }
    >
      {children}
    </span>
  )
}