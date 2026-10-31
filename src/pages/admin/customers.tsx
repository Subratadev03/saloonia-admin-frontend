import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { useBookingSync } from '../../lib/realtime'
import type { Booking } from '../../types'
import { AdminHeading, Avatar, Panel } from '../../components/admin/panel'
import { Input } from '../../components/ui/input'
import { formatTime, statusTone } from './booking-style'

type Guest = {
  key: string
  firstName: string
  lastName: string
  email: string
  visits: Booking[]
}

export function AdminCustomersPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const tick = useBookingSync((state) => state.tick)

  useEffect(() => {
    api.get<Booking[]>('/bookings').then(({ data }) => setBookings(data))
  }, [tick])

  const guests = useMemo(() => {
    const map = new Map<string, Guest>()
    for (const booking of bookings) {
      if (!booking.customer) continue
      const key = booking.customer.email || `${booking.customer.firstName}-${booking.customer.lastName}`
      const existing = map.get(key)
      if (existing) {
        existing.visits.push(booking)
      } else {
        map.set(key, {
          key,
          firstName: booking.customer.firstName,
          lastName: booking.customer.lastName,
          email: booking.customer.email,
          visits: [booking],
        })
      }
    }
    return [...map.values()]
      .map((guest) => ({
        ...guest,
        visits: [...guest.visits].sort((a, b) => b.startAt.localeCompare(a.startAt)),
      }))
      .sort((a, b) => b.visits[0].startAt.localeCompare(a.visits[0].startAt))
  }, [bookings])

  const filtered = guests.filter((guest) => {
    const haystack = `${guest.firstName} ${guest.lastName} ${guest.email}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })
  const selected = filtered.find((guest) => guest.key === selectedKey) ?? filtered[0] ?? null

  return (
    <div>
      <AdminHeading
        kicker="Guests"
        title="Customers"
        subtitle="Everyone who has booked this salon, with the services already on their card."
      />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Panel className="p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guests"
            aria-label="Search guests"
          />
          <div className="mt-3 grid max-h-[640px] gap-1 overflow-auto">
            {guests.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted">No guests yet.</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted">No guests match this search.</p>
            ) : (
              filtered.map((guest) => {
                const latest = guest.visits[0]
                const active = selected?.key === guest.key
                return (
                  <button
                    key={guest.key}
                    type="button"
                    onClick={() => setSelectedKey(guest.key)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left ${active ? 'bg-[#1c1917] text-white' : 'hover:bg-[#f7f4ef]'}`}
                  >
                    <Avatar
                      first={guest.firstName}
                      last={guest.lastName}
                      className={active ? 'bg-white/15 text-white' : undefined}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {guest.firstName} {guest.lastName}
                      </span>
                      <span className={`block truncate text-xs ${active ? 'text-white/70' : 'text-muted'}`}>
                        {guest.visits.length} visit{guest.visits.length === 1 ? '' : 's'} ·{' '}
                        {new Date(latest.startAt).toLocaleDateString()}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Panel>
        <Panel>
          {selected ? (
            <div>
              <div className="flex items-center gap-4">
                <Avatar first={selected.firstName} last={selected.lastName} className="h-14 w-14 text-base" />
                <div>
                  <h2 className="font-serif text-3xl">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <p className="text-sm text-muted">{selected.email}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Stat label="Visits" value={String(selected.visits.length)} />
                <Stat label="Last service" value={selected.visits[0].service?.name ?? '—'} />
                <Stat
                  label="Last visit"
                  value={new Date(selected.visits[0].startAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              </div>
              <p className="mt-6 text-sm font-semibold">Service history</p>
              <div className="mt-3 grid gap-2">
                {selected.visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f4ef] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{visit.service?.name}</p>
                      <p className="text-xs text-muted">
                        {visit.staff?.user?.firstName} {visit.staff?.user?.lastName} ·{' '}
                        {new Date(visit.startAt).toLocaleDateString()} {formatTime(visit.startAt)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone[visit.status]}`}>
                      {visit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Guests appear here after their first booking.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6f1ea] px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}
