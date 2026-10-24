import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'
import { AdminHeading, Avatar, Panel } from '../../components/admin/panel'
import { formatTime, sameDay, startOfDay, statusTone } from './booking-style'

type Stats = {
  today?: number
  upcoming?: number
  staff?: number
  customers?: number
}

type StaffMember = {
  id: string
  user: { firstName: string; lastName: string }
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/dashboard/stats'),
      api.get<Booking[]>('/bookings'),
      api.get<StaffMember[]>('/staff'),
    ]).then(([statsResponse, bookingsResponse, staffResponse]) => {
      setStats(statsResponse.data)
      setBookings(bookingsResponse.data)
      setStaff(staffResponse.data)
    })
  }, [])

  const today = startOfDay(new Date())
  const todaysBookings = bookings
    .filter((booking) => sameDay(booking.startAt, today) && booking.status !== BookingStatus.CANCELLED)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today)
      day.setDate(today.getDate() + index)
      const count = bookings.filter(
        (booking) => sameDay(booking.startAt, day) && booking.status !== BookingStatus.CANCELLED,
      ).length
      return {
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString([], { weekday: 'narrow' }),
        count,
      }
    })
  }, [bookings, today])

  const max = Math.max(...week.map((day) => day.count), 1)
  const bookedStylists = new Set(todaysBookings.map((booking) => booking.staff?.id).filter(Boolean)).size
  const occupancy = staff.length ? Math.round((bookedStylists / staff.length) * 100) : 0
  const guests = new Set(bookings.map((booking) => booking.customer && `${booking.customer.firstName}-${booking.customer.lastName}-${booking.customer.email}`).filter(Boolean)).size

  return (
    <div>
      <AdminHeading
        kicker="Home"
        title="Dashboard"
        subtitle="Today’s floor, the week ahead, and who is in the chair."
      />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.75fr]">
        <Panel>
          <p className="text-sm font-semibold">Today</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Appointments" value={String(stats?.today ?? todaysBookings.length)} />
            <Metric label="Chairs booked" value={`${occupancy}%`} hint={`${bookedStylists} of ${staff.length} stylists`} />
            <Metric label="Guests on file" value={String(guests || stats?.customers || 0)} hint={`${stats?.upcoming ?? 0} confirmed`} />
          </div>
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <p className="text-sm font-semibold">Next 7 days</p>
              <p className="text-xs text-muted">Appointments</p>
            </div>
            <div className="mt-4 flex h-28 items-end gap-2">
              {week.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end rounded-full bg-[#f3eee7]">
                    <div
                      className="w-full rounded-full bg-[#c4a574]"
                      style={{ height: `${Math.max((day.count / max) * 100, day.count ? 12 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold">Today’s bookings</p>
            <div className="mt-3 grid gap-2">
              {todaysBookings.length === 0 ? (
                <p className="rounded-2xl bg-[#f7f4ef] px-4 py-6 text-sm text-muted">
                  No one is booked today. Open Calendar to see the next day on the book.
                </p>
              ) : (
                todaysBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f4ef] px-3 py-2.5">
                    <Avatar first={booking.customer?.firstName} last={booking.customer?.lastName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {booking.service?.name} · {booking.staff?.user?.firstName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatTime(booking.startAt)}</p>
                      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Recent activity</p>
          <div className="mt-4 grid gap-3">
            {bookings.slice(0, 8).map((booking) => (
              <div key={booking.id} className="border-b border-[#f0ebe4] pb-3 last:border-0">
                <p className="text-sm font-medium">
                  {booking.customer?.firstName} {booking.customer?.lastName}
                </p>
                <p className="text-xs text-muted">
                  {booking.service?.name} with {booking.staff?.user?.firstName} ·{' '}
                  {new Date(booking.startAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
            {bookings.length === 0 ? <p className="text-sm text-muted">No bookings yet.</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-[#f6f1ea] px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
