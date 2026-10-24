import { useEffect, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import type { Tenant } from '../../types'
import { Button } from '../../components/ui/button'
import { Badge, Card } from '../../components/ui/card'
import { Field, Input, Textarea } from '../../components/ui/input'

export function PlatformSalonsPage() {
  const [salons, setSalons] = useState<Tenant[]>([])
  const [error, setError] = useState('')

  async function load() {
    const { data } = await api.get<Tenant[]>('/tenants')
    setSalons(data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError('')
    try {
      await api.post('/tenants', {
        name: data.get('name'),
        slug: data.get('slug'),
        email: data.get('email'),
        city: data.get('city'),
        description: data.get('description'),
        adminFirstName: data.get('adminFirstName'),
        adminLastName: data.get('adminLastName'),
        adminEmail: data.get('adminEmail'),
        adminPassword: data.get('adminPassword'),
      })
      form.reset()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-rose-deep">Platform</p>
        <h1 className="font-serif mt-2 text-4xl">All salons</h1>
        <div className="mt-6 grid gap-3">
          {salons.map((salon) => (
            <Card key={salon.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{salon.name}</p>
                  <p className="text-sm text-muted">
                    {salon.city} · /{salon.slug}
                  </p>
                </div>
                <Badge tone={salon.isActive ? 'moss' : 'muted'}>
                  {salon.isActive ? 'Live' : 'Paused'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="h-fit p-5">
        <h2 className="font-serif text-2xl">Onboard a salon</h2>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <Field label="Salon name">
            <Input name="name" required />
          </Field>
          <Field label="Slug">
            <Input name="slug" required placeholder="noir-studio" />
          </Field>
          <Field label="Salon email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="City">
            <Input name="city" />
          </Field>
          <Field label="Description">
            <Textarea name="description" />
          </Field>
          <Field label="Admin first name">
            <Input name="adminFirstName" required />
          </Field>
          <Field label="Admin last name">
            <Input name="adminLastName" required />
          </Field>
          <Field label="Admin email">
            <Input name="adminEmail" type="email" required />
          </Field>
          <Field label="Admin password">
            <Input name="adminPassword" type="password" minLength={8} required />
          </Field>
          {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
          <Button type="submit" className="w-full">Create tenant</Button>
        </form>
      </Card>
    </div>
  )
}
