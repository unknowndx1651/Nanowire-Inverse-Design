import type { ReactNode } from 'react'

interface HelperTextProps {
  children: ReactNode
  tone?: 'default' | 'error'
}

export function HelperText({ children, tone = 'default' }: HelperTextProps) {
  return (
    <p
      className={
        'mt-1.5 text-xs ' + (tone === 'error' ? 'text-danger' : 'text-muted')
      }
    >
      {children}
    </p>
  )
}