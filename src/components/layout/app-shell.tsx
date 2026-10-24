import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Scissors,
  Settings,
  Store,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth-store'
import { Role, type Tenant } from '../../types'
import { Button } from '../ui/button'
import { cn } from '../../lib/cn'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/calendar', label: 'Calendar', icon: CalendarRange },
  { to: '/admin/staff', label: 'Stylists', icon: Users },
  { to: '/admin/customers', label: 'Customers', icon: UserRound },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/admin/settings', label: 'Salon', icon: Settings },
]

const platformLinks = [
  { to: '/platform', label: 'Salons', icon: Store, end: true },
]

const customerLinks = [
  { to: '/app', label: 'My bookings', icon: CalendarRange, end: true },
  { to: '/salons', label: 'Book again', icon: Scissors },
]

export function AppShell({ variant }: { variant: 'admin' | 'platform' | 'customer' }) {
  const { user, clear } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [salonName, setSalonName] = useState(user?.tenant?.name ?? '')

  useEffect(() => {
    if (user?.tenant?.name) {
      setSalonName(user.tenant.name)
      return
    }
    if (!user?.tenantId || variant !== 'admin') return
    api.get<Tenant>(`/tenants/${user.tenantId}`).then(({ data }) => setSalonName(data.name))
  }, [user?.tenant?.name, user?.tenantId, variant])
  const links =
    variant === 'admin'
      ? user?.role === Role.STAFF
        ? adminLinks.filter((link) => link.to !== '/admin/settings' && link.to !== '/admin/ads')
        : adminLinks
      : variant === 'platform'
        ? platformLinks
        : customerLinks

  function signOut() {
    clear()
    navigate('/login')
  }

  if (variant === 'admin') {
    return (
      <div className="min-h-screen bg-[#e6e1da] text-ink lg:grid lg:grid-cols-[228px_1fr]">
        {open ? (
          <button
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 flex w-[228px] flex-col bg-[#1c1917] px-4 py-5 text-[#f6f1ea] transition duration-300 lg:static',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            <Link to="/admin" className="min-w-0">
              <p className="truncate font-serif text-2xl leading-none">{salonName || 'Saloonia'}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40">Salon desk</p>
            </Link>
            <button className="rounded-full p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="grid gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    isActive
                      ? 'bg-white/12 font-semibold text-white'
                      : 'text-white/65 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#e6e1da]/90 px-4 py-3 backdrop-blur sm:px-6">
            <button className="rounded-full bg-white p-2 shadow-sm lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <p className="truncate text-sm text-muted">
              {user?.firstName} {user?.lastName}
              {user?.role === Role.STAFF ? ' · Stylist' : ' · Admin'}
            </p>
            <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm sm:inline">
              {salonName || 'This salon'}
            </span>
          </header>
          <main className="px-4 pb-8 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-[272px] bg-[#17110e] p-5 text-ivory transition duration-300 lg:static',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-rose text-white">
              <span className="font-serif text-lg leading-none">S</span>
            </span>
            <span className="font-serif text-2xl">Saloonia</span>
          </Link>
          <button className="rounded-full p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory/40">
          {variant === 'platform' ? 'Platform' : 'Guest'}
        </p>
        <nav className="grid gap-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-gradient-to-r from-rose to-[#a83b40] text-white shadow-[0_10px_20px_-12px_rgba(194,75,78,0.9)]'
                    : 'text-ivory/70 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/50 bg-ivory/75 px-4 py-3.5 backdrop-blur-2xl">
          <button className="rounded-full p-2 hover:bg-white lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Signed in</p>
            <p className="font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut className="relative h-4 w-4" />} onClick={signOut}>
            Sign out
          </Button>
        </header>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
