import { useEffect, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../store/auth-store'
import type { Tenant } from '../../types'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { Button } from '../../components/ui/button'
import { Field, Input, Select, Textarea } from '../../components/ui/input'

export function AdminSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [salon, setSalon] = useState<Tenant | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.tenantId) return
    api
      .get<Tenant>(`/tenants/${user.tenantId}`)
      .then(({ data }) => setSalon(data))
      .catch((err) => setError(getErrorMessage(err)))
  }, [user?.tenantId])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!salon) return
    const data = new FormData(event.currentTarget)
    setError('')
    setMessage('')
    try {
      const { data: updated } = await api.patch<Tenant>(`/tenants/${salon.id}`, {
        name: data.get('name'),
        phone: data.get('phone'),
        address: data.get('address'),
        city: data.get('city'),
        description: data.get('description'),
        openingTime: data.get('openingTime'),
        closingTime: data.get('closingTime'),
        slotIntervalMinutes: Number(data.get('slotIntervalMinutes')),
      })
      setSalon(updated)
      setMessage('Salon details saved.')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!salon) {
    return <p className="text-muted">{error || 'Loading salon…'}</p>
  }

  return (
    <div>
      <AdminHeading
        kicker="House"
        title="Salon"
        subtitle="The name guests see, the hours on the profile, and how often a new slot starts."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{salon.city}</p>
          <h2 className="mt-2 font-serif text-3xl">{salon.name}</h2>
          <p className="mt-3 text-sm text-muted">{salon.description}</p>
          <div className="mt-5 grid gap-2 text-sm">
            <p>{salon.address}</p>
            <p>{salon.phone}</p>
            <p>
              {salon.openingTime} – {salon.closingTime}
            </p>
            <p>Slots every {salon.slotIntervalMinutes} min</p>
          </div>
        </Panel>
        <Panel>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Field label="Name">
              <Input name="name" defaultValue={salon.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input name="phone" defaultValue={salon.phone ?? ''} />
              </Field>
              <Field label="City">
                <Input name="city" defaultValue={salon.city ?? ''} />
              </Field>
            </div>
            <Field label="Address">
              <Input name="address" defaultValue={salon.address ?? ''} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Opens">
                <Input name="openingTime" defaultValue={salon.openingTime} />
              </Field>
              <Field label="Closes">
                <Input name="closingTime" defaultValue={salon.closingTime} />
              </Field>
              <Field label="New slot every">
                <Select name="slotIntervalMinutes" defaultValue={String(salon.slotIntervalMinutes)}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea name="description" defaultValue={salon.description ?? ''} />
            </Field>
            {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
            {message ? <p className="text-sm text-moss">{message}</p> : null}
            <Button type="submit" variant="dark" className="w-full sm:w-auto">Save salon</Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
