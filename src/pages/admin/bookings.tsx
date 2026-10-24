import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'
import { BookingStatus, type Booking } from '../../types'
import { Button } from '../../components/ui/button'
import { Select } from '../../components/ui/input'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { formatDay, formatTime, sameDay, startOfDay, statusTone } from './booking-style'
import { cn } from '../../lib/cn'

type Stylist = {
  id: string
  user: { firstName: string; lastName: string }
}

type View = 'day' | 'week' | 'month'

const HOUR_PX = 68

function addDays(day: Date, amount: number) {
  const next = new Date(day)
  next.setDate(next.getDate() + amount)
  return startOfDay(next)
}

function startOfWeek(day: Date) {
  const copy = startOfDay(day)
  const offset = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - offset)
  return copy
}

function weekDays(anchor: Date) {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

function shift(view: View, anchor: Date, direction: number) {
  if (view === 'day') return addDays(anchor, direction)
  if (view === 'week') return addDays(anchor, direction * 7)
  const next = new Date(anchor)
  next.setMonth(next.getMonth() + direction)
  return startOfDay(next)
}

function rangeLabel(view: View, anchor: Date) {
  if (view === 'day') return formatDay(anchor)
  if (view === 'week') {
    const days = weekDays(anchor)
    const start = days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })
    const end = days[6].toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${start} – ${end}`
  }
  return anchor.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

function hourRange(items: Booking[]) {
  let start = 10
  let end = 19
  for (const booking of items) {
    const begin = new Date(booking.startAt)
    const finish = new Date(booking.endAt)
    start = Math.min(start, begin.getHours())
    end = Math.max(end, finish.getHours() + (finish.getMinutes() > 0 ? 1 : 0))
  }
  return { start: Math.max(start, 7), end: Math.min(Math.max(end, start + 4), 22) }
}

function placeBlocks(items: Booking[]) {
  const sorted = [...items].sort((a, b) => a.startAt.localeCompare(b.startAt))
  const laneEnds: number[] = []
  const placed = sorted.map((booking) => {
    const start = new Date(booking.startAt).getTime()
    const end = new Date(booking.endAt).getTime()
    let lane = laneEnds.findIndex((time) => time <= start)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    return { booking, lane }
  })
  const lanes = Math.max(laneEnds.length, 1)
  return placed.map((item) => ({ ...item, lanes }))
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [view, setView] = useState<View>('day')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    const [bookingsResponse, staffResponse] = await Promise.all([
      api.get<Booking[]>('/bookings'),
      api.get<Stylist[]>('/staff'),
    ])
    setBookings(bookingsResponse.data)
    setStylists(staffResponse.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const visibleBookings = useMemo(() => {
    if (view === 'day') return bookings.filter((booking) => sameDay(booking.startAt, anchor))
    if (view === 'week') {
      const days = weekDays(anchor)
      return bookings.filter((booking) => days.some((day) => sameDay(booking.startAt, day)))
    }
    return bookings.filter((booking) => {
      const date = new Date(booking.startAt)
      return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth()
    })
  }, [anchor, bookings, view])

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null
  const range = useMemo(() => hourRange(visibleBookings), [visibleBookings])
  const hours = Array.from({ length: range.end - range.start }, (_, index) => range.start + index)

  async function updateStatus(id: string, status: Booking['status']) {
    await api.patch(`/bookings/${id}/status`, { status })
    await load()
  }

  return (
    <div>
      <AdminHeading
        kicker="Schedule"
        title="Calendar"
        subtitle="Switch between the day, the week, and the month."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-white p-1 shadow-sm">
              {(['day', 'week', 'month'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-semibold capitalize',
                    view === option ? 'bg-[#1c1917] text-white' : 'text-muted',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" aria-label="Previous" onClick={() => setAnchor((current) => shift(view, current, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              onClick={() => setAnchor(startOfDay(new Date()))}
            >
              {rangeLabel(view, anchor)}
            </button>
            <Button variant="secondary" size="sm" aria-label="Next" onClick={() => setAnchor((current) => shift(view, current, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#f0ebe4] px-5 py-4">
            <p className="text-sm font-semibold">
              {view === 'month' ? 'Month' : view === 'week' ? 'Week' : 'Appointment matrix'}
            </p>
            <p className="text-xs text-muted">{visibleBookings.length} in this {view}</p>
          </div>
          {stylists.length === 0 ? (
            <p className="p-6 text-sm text-muted">Add a stylist before the calendar can show chairs.</p>
          ) : view === 'month' ? (
            <MonthGrid
              anchor={anchor}
              bookings={bookings}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenDay={(day) => {
                setAnchor(day)
                setView('day')
              }}
            />
          ) : view === 'week' ? (
            <TimeGrid
              columns={weekDays(anchor).map((day) => ({
                key: day.toISOString(),
                title: day.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
                bookings: bookings.filter((booking) => sameDay(booking.startAt, day)),
              }))}
              hours={hours}
              rangeStart={range.start}
              selectedId={selectedId}
              onSelect={setSelectedId}
              labelFor={(booking) => `${booking.staff?.user?.firstName ?? ''} · ${booking.customer?.firstName ?? ''}`}
            />
          ) : (
            <TimeGrid
              columns={stylists.map((stylist) => ({
                key: stylist.id,
                title: `${stylist.user.firstName} ${stylist.user.lastName}`,
                bookings: visibleBookings.filter((booking) => booking.staff?.id === stylist.id),
              }))}
              hours={hours}
              rangeStart={range.start}
              selectedId={selectedId}
              onSelect={setSelectedId}
              labelFor={(booking) => `${formatTime(booking.startAt)} ${booking.customer?.firstName ?? ''}`}
            />
          )}
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Booking</p>
          {selected ? (
            <div className="mt-4 grid gap-3 text-sm">
              <p className="font-serif text-2xl">
                {selected.customer?.firstName} {selected.customer?.lastName}
              </p>
              <p className="text-muted">{selected.customer?.email}</p>
              <p>
                {selected.service?.name}
                <span className="text-muted"> · {selected.service?.durationMinutes} min</span>
              </p>
              <p>
                {selected.staff?.user?.firstName} {selected.staff?.user?.lastName}
              </p>
              <p>
                {new Date(selected.startAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                · {formatTime(selected.startAt)} – {formatTime(selected.endAt)}
              </p>
              {selected.notes ? <p className="rounded-2xl bg-[#f7f4ef] px-3 py-2 text-muted">{selected.notes}</p> : null}
              <label className="grid gap-2">
                <span className="text-[13px] font-semibold text-ink/75">Status</span>
                <Select
                  value={selected.status}
                  onChange={(event) => updateStatus(selected.id, event.target.value as Booking['status'])}
                >
                  {Object.values(BookingStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Select a block to see the guest and change the status.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function TimeGrid({
  columns,
  hours,
  rangeStart,
  selectedId,
  onSelect,
  labelFor,
}: {
  columns: { key: string; title: string; bookings: Booking[] }[]
  hours: number[]
  rangeStart: number
  selectedId: string | null
  onSelect: (id: string) => void
  labelFor: (booking: Booking) => string
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `72px repeat(${columns.length}, minmax(140px, 1fr))` }}
      >
        <div />
        {columns.map((column) => (
          <div key={column.key} className="border-b border-[#f0ebe4] px-3 py-3 text-sm font-semibold">
            {column.title}
          </div>
        ))}
        <div className="relative" style={{ height: hours.length * HOUR_PX }}>
          {hours.map((hour, index) => (
            <div key={hour} className="absolute right-2 text-[11px] text-muted" style={{ top: index * HOUR_PX - 6 }}>
              {new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric' })}
            </div>
          ))}
        </div>
        {columns.map((column) => (
          <div key={column.key} className="relative border-l border-[#f3eee8]" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-[#f3eee8]"
                style={{ top: (hour - rangeStart) * HOUR_PX }}
              />
            ))}
            {placeBlocks(column.bookings).map(({ booking, lane, lanes }) => {
              const start = new Date(booking.startAt)
              const end = new Date(booking.endAt)
              const top = ((start.getHours() - rangeStart) * 60 + start.getMinutes()) * (HOUR_PX / 60)
              const height = Math.max(((end.getTime() - start.getTime()) / 60000) * (HOUR_PX / 60), 42)
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => onSelect(booking.id)}
                  className={`absolute overflow-hidden rounded-xl border px-2 py-1.5 text-left ${statusTone[booking.status]} ${selectedId === booking.id ? 'ring-2 ring-[#1c1917]' : ''}`}
                  style={{
                    top,
                    height,
                    left: `calc(${(lane / lanes) * 100}% + 4px)`,
                    width: `calc(${100 / lanes}% - 8px)`,
                  }}
                >
                  <p className="truncate text-xs font-semibold">{labelFor(booking)}</p>
                  <p className="truncate text-[11px] opacity-80">{booking.service?.name}</p>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthGrid({
  anchor,
  bookings,
  selectedId,
  onSelect,
  onOpenDay,
}: {
  anchor: Date
  bookings: Booking[]
  selectedId: string | null
  onSelect: (id: string) => void
  onOpenDay: (day: Date) => void
}) {
  const today = startOfDay(new Date())
  const cells = monthCells(anchor)
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label} className="border-b border-[#f0ebe4] px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </div>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth()
          const items = bookings
            .filter((booking) => sameDay(booking.startAt, day))
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
          const isToday =
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate()
          return (
            <div
              key={day.toISOString()}
              className={cn('min-h-28 border-b border-l border-[#f3eee8] p-2', inMonth ? 'bg-white' : 'bg-[#faf7f3]')}
            >
              <button
                type="button"
                className={cn(
                  'mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold',
                  isToday ? 'bg-[#1c1917] text-white' : inMonth ? 'text-ink' : 'text-muted',
                )}
                onClick={() => onOpenDay(day)}
              >
                {day.getDate()}
              </button>
              <div className="grid gap-1">
                {items.slice(0, 3).map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onSelect(booking.id)}
                    className={cn(
                      'truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium',
                      statusTone[booking.status],
                      selectedId === booking.id && 'ring-2 ring-[#1c1917]',
                    )}
                  >
                    {formatTime(booking.startAt)} {booking.customer?.firstName}
                  </button>
                ))}
                {items.length > 3 ? (
                  <button type="button" className="text-left text-[11px] font-semibold text-muted" onClick={() => onOpenDay(day)}>
                    +{items.length - 3} more
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
