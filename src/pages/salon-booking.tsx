import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import type { PublicSalon, SalonService, Slot } from '../types'
import { Role } from '../types'
import { Button } from '../components/ui/button'
import { Badge, Card } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { cn } from '../lib/cn'

function formatMoney(value: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function tomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function SalonBookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [salon, setSalon] = useState<PublicSalon | null>(null)
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState(tomorrow())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    api.get<PublicSalon>(`/public/salons/${slug}`).then(({ data }) => {
      setSalon(data)
      setServiceId(data.services[0]?.id ?? '')
    })
  }, [slug])

  const selectedService = salon?.services.find((service) => service.id === serviceId)
  const eligibleStaff = useMemo(
    () =>
      salon?.staff.filter((member) => !serviceId || member.serviceIds.includes(serviceId)) ?? [],
    [salon, serviceId],
  )

  useEffect(() => {
    if (!slug || !serviceId || !date) return
    const params = new URLSearchParams({ date, serviceId })
    if (staffId) params.set('staffId', staffId)
    api.get<Slot[]>(`/public/salons/${slug}/slots?${params.toString()}`).then(({ data }) => {
      setSlots(data)
      setSelectedSlot(null)
    })
  }, [slug, serviceId, staffId, date])

  async function book() {
    if (!selectedSlot || !slug) return
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== Role.CUSTOMER && user.role !== Role.SALON_ADMIN) {
      setError('Sign in as a guest to book this chair.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await api.post(`/public/salons/${slug}/bookings`, {
        serviceId,
        staffId: selectedSlot.staffId,
        startAt: selectedSlot.startAt,
        notes,
      })
      setMessage('Booked. You can review it in your bookings.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not complete booking'))
    } finally {
      setLoading(false)
    }
  }

  if (!salon) {
    return <div className="page-wrap py-16 text-muted">Loading salon…</div>
  }

  return (
    <div className="page-wrap py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">{salon.city}</p>
          <h1 className="font-serif mt-4 text-5xl">{salon.name}</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">{salon.description}</p>
          <p className="mt-4 text-sm text-muted">
            {salon.address} · {salon.openingTime}–{salon.closingTime}
          </p>
          <div className="mt-8 grid gap-3">
            {salon.services.map((service: SalonService) => {
              const active = service.id === serviceId
              return (
                <button
                  key={service.id}
                  onClick={() => setServiceId(service.id)}
                  className={cn(
                    'rounded-[26px] border p-4 text-left transition duration-200',
                    active
                      ? 'border-rose/40 bg-paper shadow-[0_16px_30px_-22px_rgba(194,75,78,0.55)] ring-2 ring-rose/20'
                      : 'border-line/80 bg-white/40 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-paper',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{service.name}</h2>
                    <Badge tone={active ? 'rose' : 'gold'}>{formatMoney(service.price)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {service.durationMinutes} min · {service.category}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl">Choose a slot</h2>
            <Badge>Step 2</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Stylist">
              <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
                <option value="">Any available</option>
                {eligibleStaff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {slots.length === 0 ? (
              <p className="col-span-full text-sm text-muted">
                No open chairs for this combination. Try another day or stylist.
              </p>
            ) : (
              slots.map((slot) => {
                const active =
                  selectedSlot?.startAt === slot.startAt && selectedSlot.staffId === slot.staffId
                return (
                  <button
                    key={`${slot.staffId}-${slot.startAt}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left text-sm transition duration-200',
                      active
                        ? 'border-transparent bg-gradient-to-b from-[#d46264] to-[#a83b40] text-white shadow-[0_12px_22px_-14px_rgba(168,59,64,0.95)]'
                        : 'border-line bg-ivory/80 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold">
                      {new Date(slot.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {active ? <Check className="h-4 w-4" /> : null}
                    </div>
                    <div className={active ? 'text-white/80' : 'text-muted'}>{slot.staffName}</div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-6">
            <Field label="Notes for the salon">
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </div>

          {selectedService ? (
            <p className="mt-4 text-sm text-muted">
              {selectedService.name} · {selectedService.durationMinutes} min ·{' '}
              {formatMoney(selectedService.price)}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-moss">{message}</p> : null}
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!selectedSlot || loading}
            loading={loading}
            icon={<CalendarClock className="relative h-4 w-4" />}
            onClick={book}
          >
            {user ? (loading ? 'Holding the chair…' : 'Confirm booking') : 'Sign in to book'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
