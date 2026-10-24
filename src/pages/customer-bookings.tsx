import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
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
  const [bookings, setBookings] = useState<Booking[]>([])

  async function load() {
    const { data } = await api.get<Booking[]>('/bookings')
    setBookings(data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function cancel(id: string) {
    await api.patch(`/bookings/${id}/status`, { status: BookingStatus.CANCELLED })
    await load()
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
                  {booking.status === BookingStatus.CONFIRMED ? (
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
