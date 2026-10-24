import { ArrowRight, CalendarCheck, MapPin, Sparkles } from 'lucide-react'
import { ButtonLink } from '../components/ui/button'
import { Card } from '../components/ui/card'

export function LandingPage() {
  return (
    <div>
      <section className="page-wrap grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="eyebrow">Multi-salon booking</p>
          <h1 className="font-serif mt-5 text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Reserve the chair.
            <br />
            <span className="text-rose-deep">Skip the wait.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Book services across independent salons. Each salon keeps its own staff,
            hours, and books — guests just pick a slot.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/salons" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
              Browse salons
            </ButtonLink>
            <ButtonLink to="/register" size="lg" variant="secondary">
              Book as a guest
            </ButtonLink>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3 text-sm">
            {[
              ['2', 'Live salons'],
              ['4', 'Roles'],
              ['30m', 'Slot grid'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-line/80 bg-white/55 px-3 py-3">
                <p className="font-serif text-2xl">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="relative bg-[linear-gradient(155deg,#17110e_0%,#4a2a28_52%,#c24b4e_120%)] p-8 text-ivory">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-gold/20 blur-2xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Today at Luxe Atelier</p>
            <h2 className="font-serif mt-5 text-4xl">Anaya, 11:00</h2>
            <p className="mt-3 text-ivory/75">Signature Haircut · 60 min · Bandra West</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {['Chair 2', 'Confirmed', 'Walk-in closed'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
                  {item}
                </div>
              ))}
            </div>
            <ButtonLink
              to="/salons/luxe-atelier"
              size="sm"
              variant="secondary"
              className="mt-8"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Book this look
            </ButtonLink>
          </div>
        </Card>
      </section>

      <section className="page-wrap grid gap-4 pb-16 md:grid-cols-3">
        {[
          {
            icon: MapPin,
            title: 'One city, many salons',
            copy: 'Each salon is a tenant with its own catalogue, staff, and opening hours.',
          },
          {
            icon: CalendarCheck,
            title: 'Real slots, not guesswork',
            copy: 'Availability is calculated from staff schedules and existing bookings.',
          },
          {
            icon: Sparkles,
            title: 'Role-aware desks',
            copy: 'Platform admin, salon admin, staff, and guests each see the right portal.',
          },
        ].map((item, index) => (
          <Card
            key={item.title}
            className="group p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(28,20,16,0.45)]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose/10 text-rose">
              <item.icon className="h-5 w-5" />
            </span>
            <h3 className="font-serif mt-4 text-2xl">{item.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{item.copy}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
