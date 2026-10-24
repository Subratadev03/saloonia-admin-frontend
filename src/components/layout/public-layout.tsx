import { Link, Outlet } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useAuthStore } from '../../store/auth-store'
import { Role } from '../../types'
import { ButtonLink } from '../ui/button'

function homeFor(role?: string) {
  if (role === Role.SUPER_ADMIN) return '/platform'
  if (role === Role.SALON_ADMIN || role === Role.STAFF) return '/admin'
  if (role === Role.CUSTOMER) return '/app'
  return '/login'
}

export function PublicLayout() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-ivory/80 backdrop-blur-2xl">
        <div className="page-wrap flex items-center justify-between gap-3 py-3.5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ink text-gold shadow-lg shadow-ink/20">
              <span className="font-serif text-lg leading-none">S</span>
            </span>
            <span className="font-serif text-2xl tracking-tight">Saloonia</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <ButtonLink to="/salons" size="sm" variant="ghost" className="hidden sm:inline-flex">
              Explore salons
            </ButtonLink>
            {user ? (
              <ButtonLink to={homeFor(user.role)} size="sm" variant="dark" icon={<ArrowUpRight className="h-4 w-4" />}>
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" size="sm" variant="secondary">
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" size="sm">
                  Create account
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="mt-16 border-t border-line/80">
        <div className="page-wrap flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Saloonia — multi-salon booking, without the phone tag.</p>
          <p>NestJS · React · PostgreSQL · JWT</p>
        </div>
      </footer>
    </div>
  )
}
