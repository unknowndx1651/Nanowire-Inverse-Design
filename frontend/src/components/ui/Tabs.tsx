interface TabItem {
  label: string
  value: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex items-center gap-1 border-b border-border">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={
              'relative px-3 py-2 text-sm font-medium transition-colors duration-150 ' +
              (active ? 'text-foreground' : 'text-muted hover:text-foreground')
            }
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
            )}
          </button>
        )
      })}
    </div>
  )
}