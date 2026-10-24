import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import type { SalonService } from '../../types'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { ScrollStatus, TableSearch, useScrollPages } from '../../components/admin/scroll-page'
import { Modal } from '../../components/admin/modal'
import { Button } from '../../components/ui/button'
import { Field, Input, Textarea } from '../../components/ui/input'
import { useAuthStore } from '../../store/auth-store'
import { Role } from '../../types'

type Draft = {
  name: string
  category: string
  durationMinutes: string
  price: string
  description: string
}

const blank: Draft = {
  name: '',
  category: 'Hair',
  durationMinutes: '60',
  price: '',
  description: '',
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function AdminServicesPage() {
  const user = useAuthStore((state) => state.user)
  const canEdit = user?.role === Role.SALON_ADMIN || user?.role === Role.SUPER_ADMIN
  const [services, setServices] = useState<SalonService[]>([])
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<SalonService | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const close = useCallback(() => {
    setMode(null)
    setError('')
  }, [])

  async function load() {
    const { data } = await api.get<SalonService[]>('/services')
    setServices(data)
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setSelected(null)
    setDraft(blank)
    setError('')
    setMode('create')
  }

  function openEdit(service: SalonService) {
    setSelected(service)
    setDraft({
      name: service.name,
      category: service.category,
      durationMinutes: String(service.durationMinutes),
      price: String(Number(service.price)),
      description: service.description ?? '',
    })
    setError('')
    setMode('edit')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      name: draft.name,
      category: draft.category,
      description: draft.description,
      durationMinutes: Number(draft.durationMinutes),
      price: Number(draft.price),
    }
    try {
      if (mode === 'edit' && selected) {
        await api.patch(`/services/${selected.id}`, payload)
      } else {
        await api.post('/services', payload)
      }
      close()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return services
    return services.filter((service) =>
      `${service.name} ${service.category} ${service.description ?? ''}`.toLowerCase().includes(needle),
    )
  }, [query, services])
  const page = useScrollPages(filtered, query)

  async function confirmDelete() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await api.delete(`/services/${selected.id}`)
      close()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminHeading
        kicker="Menu"
        title="Services"
        subtitle="Every treatment, with duration, price, and description."
        action={
          canEdit ? (
            <Button type="button" variant="dark" onClick={openCreate}>
              Add service
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden p-0">
        <TableSearch value={query} onChange={setQuery} placeholder="Search services" />
        <div className="max-h-[480px] overflow-auto" onScroll={page.onScroll}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-[#f6f1ea] text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                {canEdit ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {page.visible.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-muted">
                    {services.length === 0 ? 'No services yet.' : 'No services match this search.'}
                  </td>
                </tr>
              ) : (
                page.visible.map((service) => (
                  <tr key={service.id} className="border-t border-[#f0ebe4]">
                    <td className="px-4 py-3 font-semibold">{service.name}</td>
                    <td className="px-4 py-3">{service.category}</td>
                    <td className="px-4 py-3">{service.durationMinutes} min</td>
                    <td className="px-4 py-3">{formatMoney(service.price)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">{service.description || '—'}</td>
                    {canEdit ? (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(service)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelected(service)
                              setError('')
                              setMode('delete')
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ScrollStatus
          shown={page.shown}
          total={page.total}
          hasMore={page.hasMore}
          onShowMore={page.showMore}
        />
      </Panel>

      {mode === 'create' || mode === 'edit' ? (
        <Modal title={mode === 'edit' ? 'Edit service' : 'Add service'} onClose={close}>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                required
              />
            </Field>
            <Field label="Category">
              <Input
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Duration (min)">
                <Input
                  type="number"
                  min={5}
                  value={draft.durationMinutes}
                  onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value })}
                  required
                />
              </Field>
              <Field label="Price">
                <Input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  required
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>
            {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="dark" loading={saving}>
                {mode === 'edit' ? 'Save changes' : 'Add service'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {mode === 'delete' && selected ? (
        <Modal title="Delete service" onClose={close}>
          <p className="text-sm text-muted">
            Delete {selected.name}? Bookings for this treatment are removed with it.
          </p>
          {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={saving} onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
