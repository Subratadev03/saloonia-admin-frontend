import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { payBooking, priceToPaise } from '../lib/razorpay'
import { useBookingSync } from '../lib/realtime'
import { useAuthStore } from '../store/auth-store'
import { BookingStatus, type Booking } from '../types'
import { Badge, Card } from '../components/ui/card'
import { Button, ButtonLink } from '../components/ui/button'

function toneFor(status: Booking['status']) {
  if (status === BookingStatus.CONFIRMED) return 'moss' as const
  if (status === BookingStatus.CANCELLED) return 'muted' as const
  if (status === BookingStatus.COMPLETED) return 'gold' as const
  return 'rose' as const
}

export function CustomerBookingsPage() {
  const user = useAuthStore((state) => state.user)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState('')
  const tick = useBookingSync((state) => state.tick)

  async function load() {
    const { data } = await api.get<Booking[]>('/bookings')
    setBookings(data)
  }

  useEffect(() => {
    void load()
  }, [tick])

  async function cancel(id: string) {
    await api.patch(`/bookings/${id}/status`, { status: BookingStatus.CANCELLED })
    await load()
  }

  async function pay(booking: Booking) {
    if (!user || !booking.service) return
    setPayingId(booking.id)
    setError('')
    try {
      const result = await payBooking({
        bookingId: booking.id,
        amount: priceToPaise(booking.service.price),
        name: booking.tenant?.name ?? 'Saloonia',
        description: booking.service.name,
        prefill: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          contact: user.phone ?? '',
        },
        onFailed: (reason) => setError(reason),
      })
      if (result === 'dismissed') setError('Checkout closed. You can pay again while the chair is held.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, err instanceof Error ? err.message : 'Payment could not be completed.'))
    } finally {
      setPayingId('')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your calendar</p>
          <h1 className="font-serif mt-3 text-4xl">Upcoming and past visits</h1>
        </div>
        <ButtonLink to="/salons" icon={<Plus className="h-4 w-4" />}>
          Book another salon
        </ButtonLink>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-deep">{error}</p> : null}
      <div className="mt-8 grid gap-4">
        {bookings.length === 0 ? (
          <Card className="p-8 text-muted">No bookings yet. Pick a salon and take a slot.</Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-serif text-2xl">{booking.service?.name}</p>
                  <p className="text-muted">
                    {booking.tenant?.name} · {booking.staff?.user?.firstName}{' '}
                    {booking.staff?.user?.lastName}
                  </p>
                  <p className="mt-1 text-sm">
                    {new Date(booking.startAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={toneFor(booking.status)}>{booking.status}</Badge>
                  {booking.service && booking.payment?.status !== 'PAID' && (booking.status === BookingStatus.PENDING || booking.payment?.status === 'DUE') ? (
                    <Button size="sm" disabled={payingId === booking.id} onClick={() => pay(booking)}>
                      {payingId === booking.id ? 'Opening checkout…' : 'Pay now'}
                    </Button>
                  ) : null}
                  {booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING ? (
                    <Button size="sm" variant="secondary" onClick={() => cancel(booking.id)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
