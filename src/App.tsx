import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/public-layout'
import { AppShell } from './components/layout/app-shell'
import { ProtectedRoute } from './components/protected-route'
import { LandingPage } from './pages/landing'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { SalonsPage } from './pages/salons'
import { SalonBookingPage } from './pages/salon-booking'
import { CustomerBookingsPage } from './pages/customer-bookings'
import { AdminDashboardPage } from './pages/admin/dashboard'
import { AdminBookingsPage } from './pages/admin/bookings'
import { AdminCustomersPage } from './pages/admin/customers'
import { AdminServicesPage } from './pages/admin/services'
import { AdminStaffPage } from './pages/admin/staff'
import { AdminSettingsPage } from './pages/admin/settings'
import { AdminAdsPage } from './pages/admin/ads'
import { PlatformSalonsPage } from './pages/platform/salons'
import { Role } from './types'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/salons" element={<SalonsPage />} />
          <Route path="/salons/:slug" element={<SalonBookingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={[Role.CUSTOMER]} />}>
          <Route element={<AppShell variant="customer" />}>
            <Route path="/app" element={<CustomerBookingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={[Role.SALON_ADMIN, Role.STAFF]} />}>
          <Route element={<AppShell variant="admin" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/calendar" element={<AdminBookingsPage />} />
            <Route path="/admin/bookings" element={<Navigate to="/admin/calendar" replace />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/ads" element={<AdminAdsPage />} />
            <Route path="/admin/staff" element={<AdminStaffPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={[Role.SUPER_ADMIN]} />}>
          <Route element={<AppShell variant="platform" />}>
            <Route path="/platform" element={<PlatformSalonsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
