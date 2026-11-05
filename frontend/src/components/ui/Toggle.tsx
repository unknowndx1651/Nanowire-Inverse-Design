interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
          'disabled:opacity-50 disabled:pointer-events-none ' +
          (checked ? 'bg-accent' : 'bg-border')
        }
      >
        <span
          className={
            'absolute top-0.5 size-4 rounded-full bg-surface transition-transform duration-150 ' +
            (checked ? 'translate-x-[18px]' : 'translate-x-0.5')
          }
        />
      </button>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  )
}