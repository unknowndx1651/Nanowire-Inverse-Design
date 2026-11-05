import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Design Lab', to: '/design' },
  { label: 'Optimization', to: '/optimization' },
  { label: 'Results', to: '/results' },
]

export function Header() {
  return (
    <header className="border-border bg-surface/0">

      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">
        <span className="text-3xl font-bold text-foreground">
          NANOWIRE DESIGN OPTIMIZER
        </span>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'relative px-3 py-2 text-lg font-medium transition-colors duration-150 ' +
                (isActive
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground')
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-0.5 bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}