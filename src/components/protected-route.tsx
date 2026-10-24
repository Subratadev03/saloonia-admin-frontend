import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import type { Role } from '../types'

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const user = useAuthStore((state) => state.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
