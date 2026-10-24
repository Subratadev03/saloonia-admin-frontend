import { useEffect, useState } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Tenant } from '../types'
import { Badge, Card } from '../components/ui/card'

export function SalonsPage() {
  const [salons, setSalons] = useState<Tenant[]>([])

  useEffect(() => {
    api.get<Tenant[]>('/public/salons').then(({ data }) => setSalons(data))
  }, [])

  return (
    <div className="page-wrap py-12">
      <p className="eyebrow">Find a chair</p>
      <h1 className="font-serif mt-4 text-5xl">Salons on Saloonia</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {salons.map((salon) => (
          <Link key={salon.id} to={`/salons/${salon.slug}`} className="group">
            <Card className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(28,20,16,0.45)]">
              <div
                className="mb-5 h-1.5 w-16 rounded-full"
                style={{ background: salon.brandColor }}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl">{salon.name}</h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-muted">
                    <MapPin className="h-4 w-4" />
                    {salon.city}
                  </p>
                </div>
                <Badge tone="gold">{salon.openingTime} – {salon.closingTime}</Badge>
              </div>
              <p className="mt-4 leading-relaxed text-muted">{salon.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-deep">
                View slots
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
