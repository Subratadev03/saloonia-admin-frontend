import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { ScrollStatus, TableSearch, useScrollPages } from '../../components/admin/scroll-page'
import { Modal } from '../../components/admin/modal'
import { Button } from '../../components/ui/button'
import { Field, Input, Textarea } from '../../components/ui/input'
import { useAuthStore } from '../../store/auth-store'
import type { SalonService } from '../../types'
import { Role } from '../../types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type ScheduleDay = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isOff: boolean
}

type StaffMember = {
  id: string
  specialty: string | null
  bio: string | null
  user: { firstName: string; lastName: string; email: string; phone?: string | null }
  services: { id: string; name: string }[]
  schedules: ScheduleDay[]
}

type Draft = {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  specialty: string
  bio: string
}

const blank: Draft = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  specialty: '',
  bio: '',
}

function normalizeDays(schedules: ScheduleDay[] = []): ScheduleDay[] {
  return DAY_NAMES.map((_, dayOfWeek) => {
    const existing = schedules.find((day) => day.dayOfWeek === dayOfWeek)
    return {
      dayOfWeek,
      startTime: (existing?.startTime ?? '09:00').slice(0, 5),
      endTime: (existing?.endTime ?? '18:00').slice(0, 5),
      isOff: existing?.isOff ?? dayOfWeek === 0,
    }
  })
}

function hoursSummary(schedules: ScheduleDay[]) {
  const days = normalizeDays(schedules)
  const working = days.filter((day) => !day.isOff)
  if (working.length === 0) return 'No bookable hours'
  const sameWindow = working.every(
    (day) => day.startTime === working[0].startTime && day.endTime === working[0].endTime,
  )
  const names = working.map((day) => DAY_NAMES[day.dayOfWeek].slice(0, 3)).join(', ')
  if (sameWindow) return `${names} · ${working[0].startTime}–${working[0].endTime}`
  return names
}

export function AdminStaffPage() {
  const user = useAuthStore((state) => state.user)
  const canEdit = user?.role === Role.SALON_ADMIN || user?.role === Role.SUPER_ADMIN
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [services, setServices] = useState<SalonService[]>([])
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<StaffMember | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [days, setDays] = useState<ScheduleDay[]>(normalizeDays())
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const close = useCallback(() => {
    setMode(null)
    setError('')
  }, [])

  async function load() {
    const [staffResponse, servicesResponse] = await Promise.all([
      api.get<StaffMember[]>('/staff'),
      api.get<SalonService[]>('/services'),
    ])
    setStaff(staffResponse.data)
    setServices(servicesResponse.data.filter((service) => service.isActive))
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setSelected(null)
    setDraft(blank)
    setServiceIds([])
    setError('')
    setMode('create')
  }

  function openEdit(member: StaffMember) {
    setSelected(member)
    setDraft({
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      password: '',
      phone: member.user.phone ?? '',
      specialty: member.specialty ?? '',
      bio: member.bio ?? '',
    })
    setDays(normalizeDays(member.schedules))
    setServiceIds(member.services.map((service) => service.id))
    setError('')
    setMode('edit')
  }

  function updateDay(dayOfWeek: number, patch: Partial<ScheduleDay>) {
    setDays((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
    )
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/staff', {
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        password: draft.password,
        phone: draft.phone || undefined,
        specialty: draft.specialty,
        bio: draft.bio,
        serviceIds,
      })
      close()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const invalid = days.find((day) => !day.isOff && day.startTime >= day.endTime)
    if (invalid) {
      setError(`${DAY_NAMES[invalid.dayOfWeek]} must end after it starts.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.patch(`/staff/${selected.id}`, {
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone,
        specialty: draft.specialty,
        bio: draft.bio,
        serviceIds,
      })
      await api.put(`/staff/${selected.id}/schedule`, {
        days: days.map((day) => ({
          ...day,
          startTime: day.startTime.slice(0, 5),
          endTime: day.endTime.slice(0, 5),
        })),
      })
      close()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await api.delete(`/staff/${selected.id}`)
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
    if (!needle) return staff
    return staff.filter((member) => {
      const haystack = [
        member.user.firstName,
        member.user.lastName,
        member.user.email,
        member.specialty,
        member.bio,
        ...member.services.map((service) => service.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, staff])
  const page = useScrollPages(filtered, query)

  return (
    <div>
      <AdminHeading
        kicker="Floor"
        title="Stylists"
        subtitle="Each chair, the services they offer, and the hours guests can book."
        action={
          canEdit ? (
            <Button type="button" variant="dark" onClick={openCreate}>
              Add stylist
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden p-0">
        <TableSearch value={query} onChange={setQuery} placeholder="Search stylists" />
        <div className="max-h-[480px] overflow-auto" onScroll={page.onScroll}>
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 bg-[#f6f1ea] text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Specialty</th>
                <th className="px-4 py-3 font-semibold">Services</th>
                <th className="px-4 py-3 font-semibold">Hours</th>
                <th className="px-4 py-3 font-semibold">Bio</th>
                {canEdit ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {page.visible.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-muted">
                    {staff.length === 0 ? 'No stylists yet.' : 'No stylists match this search.'}
                  </td>
                </tr>
              ) : (
                page.visible.map((member) => (
                  <tr key={member.id} className="border-t border-[#f0ebe4]">
                    <td className="px-4 py-3 font-semibold">
                      {member.user.firstName} {member.user.lastName}
                    </td>
                    <td className="px-4 py-3">{member.user.email}</td>
                    <td className="px-4 py-3">{member.specialty || '—'}</td>
                    <td className="max-w-[220px] px-4 py-3 text-muted">
                      {member.services.map((service) => service.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">{hoursSummary(member.schedules)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">{member.bio || '—'}</td>
                    {canEdit ? (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(member)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelected(member)
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
        <Modal title={mode === 'edit' ? 'Edit stylist' : 'Add stylist'} onClose={close} wide>
          <form className="grid gap-3" onSubmit={mode === 'edit' ? onEdit : onCreate}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name">
                <Input
                  value={draft.firstName}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                  required
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={draft.lastName}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                  required
                />
              </Field>
            </div>
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                required
                disabled={mode === 'edit'}
              />
            </Field>
            {mode === 'create' ? (
              <Field label="Temp password">
                <Input
                  type="password"
                  minLength={8}
                  value={draft.password}
                  onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                  required
                />
              </Field>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone">
                <Input
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                />
              </Field>
              <Field label="Specialty">
                <Input
                  value={draft.specialty}
                  onChange={(event) => setDraft({ ...draft, specialty: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              />
            </Field>
            <div>
              <p className="text-[13px] font-semibold text-ink/75">Services they can book</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.id)}
                      onChange={(event) =>
                        setServiceIds((current) =>
                          event.target.checked
                            ? [...current, service.id]
                            : current.filter((id) => id !== service.id),
                        )
                      }
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>
            {mode === 'edit' ? (
              <div className="grid gap-2">
                <p className="text-[13px] font-semibold text-ink/75">Weekly hours</p>
                {days.map((day) => (
                  <div key={day.dayOfWeek} className="grid items-center gap-2 sm:grid-cols-[140px_1fr_1fr]">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!day.isOff}
                        onChange={(event) => updateDay(day.dayOfWeek, { isOff: !event.target.checked })}
                      />
                      {DAY_NAMES[day.dayOfWeek]}
                    </label>
                    <Input
                      type="time"
                      aria-label={`${DAY_NAMES[day.dayOfWeek]} start`}
                      value={day.startTime}
                      disabled={day.isOff}
                      onChange={(event) => updateDay(day.dayOfWeek, { startTime: event.target.value })}
                    />
                    <Input
                      type="time"
                      aria-label={`${DAY_NAMES[day.dayOfWeek]} end`}
                      value={day.endTime}
                      disabled={day.isOff}
                      onChange={(event) => updateDay(day.dayOfWeek, { endTime: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                New stylists start Monday–Saturday, 09:00–18:00. Change those hours from Edit.
              </p>
            )}
            {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="dark" loading={saving}>
                {mode === 'edit' ? 'Save changes' : 'Add stylist'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {mode === 'delete' && selected ? (
        <Modal title="Delete stylist" onClose={close}>
          <p className="text-sm text-muted">
            Delete {selected.user.firstName} {selected.user.lastName}? Their bookings are removed with them.
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
