import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../store/auth-store'
import { Role } from '../../types'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { Modal } from '../../components/admin/modal'
import { Button } from '../../components/ui/button'
import { Field, Input, Textarea } from '../../components/ui/input'

type Advertisement = {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  isActive: boolean
  sortOrder: number
  salonName: string | null
  salonSlug: string | null
}

type Draft = {
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  sortOrder: string
  isActive: boolean
}

const blank: Draft = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: '0',
  isActive: true,
}

export function AdminAdsPage() {
  const user = useAuthStore((state) => state.user)
  const [ads, setAds] = useState<Advertisement[]>([])
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Advertisement | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const close = useCallback(() => {
    setMode(null)
    setError('')
  }, [])

  async function load() {
    const { data } = await api.get<Advertisement[]>('/advertisements')
    setAds(data)
  }

  useEffect(() => {
    load()
      .catch((err) => setError(getErrorMessage(err, 'Could not load advertisements.')))
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setSelected(null)
    setDraft(blank)
    setError('')
    setMode('create')
  }

  function openEdit(ad: Advertisement) {
    setSelected(ad)
    setDraft({
      title: ad.title,
      subtitle: ad.subtitle ?? '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl ?? '',
      sortOrder: String(ad.sortOrder),
      isActive: ad.isActive,
    })
    setError('')
    setMode('edit')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      imageUrl: draft.imageUrl.trim(),
      linkUrl: draft.linkUrl.trim(),
      sortOrder: Number(draft.sortOrder) || 0,
      isActive: draft.isActive,
    }
    try {
      if (mode === 'edit' && selected) {
        await api.patch(`/advertisements/${selected.id}`, payload)
      } else {
        await api.post('/advertisements', payload)
      }
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
      await api.delete(`/advertisements/${selected.id}`)
      close()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (user?.role === Role.STAFF) {
    return (
      <AdminHeading
        kicker="Discover"
        title="Advertisements"
        subtitle="Salon admins manage the banners on the guest Discover page."
      />
    )
  }

  return (
    <div>
      <AdminHeading
        kicker="Discover"
        title="Advertisements"
        subtitle="Banners shown under search on the guest Discover Salons page. Leave the link empty to open your salon."
        action={
          <Button type="button" variant="dark" onClick={openCreate}>
            Add banner
          </Button>
        }
      />
      {error && !mode ? <p className="mb-3 text-sm text-rose-deep">{error}</p> : null}
      <div className="grid gap-3">
        {loading ? <Panel><p className="text-sm text-muted">Loading banners…</p></Panel> : null}
        {!loading && ads.length === 0 ? (
          <Panel>
            <p className="text-sm text-muted">No banners yet. Add one and it appears under the guest search bar.</p>
          </Panel>
        ) : null}
        {ads.map((ad) => (
          <Panel key={ad.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={ad.imageUrl} alt="" className="h-24 w-full rounded-2xl object-cover sm:w-40" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{ad.title}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ad.isActive ? 'bg-[#dcecd6] text-[#245532]' : 'bg-[#ece7e1] text-[#4d463f]'}`}>
                  {ad.isActive ? 'Live' : 'Hidden'}
                </span>
              </div>
              {ad.subtitle ? <p className="mt-1 text-sm text-muted">{ad.subtitle}</p> : null}
              <p className="mt-1 truncate text-xs text-muted">{ad.linkUrl || (ad.salonSlug ? `Opens /salons/${ad.salonSlug}` : 'No link')}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(ad)}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => {
                  setSelected(ad)
                  setError('')
                  setMode('delete')
                }}
              >
                Delete
              </Button>
            </div>
          </Panel>
        ))}
      </div>

      {mode === 'create' || mode === 'edit' ? (
        <Modal title={mode === 'edit' ? 'Edit banner' : 'Add banner'} onClose={close} wide>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field label="Headline">
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required maxLength={120} />
            </Field>
            <Field label="Subtitle">
              <Textarea value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} maxLength={240} />
            </Field>
            <Field label="Image link">
              <Input
                value={draft.imageUrl}
                onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                required
                placeholder="https://"
                type="url"
              />
            </Field>
            {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="h-32 w-full rounded-2xl object-cover" /> : null}
            <Field label="Click-through link">
              <Input
                value={draft.linkUrl}
                onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })}
                placeholder="https:// — leave empty to open your salon"
                type="url"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-end">
              <Field label="Order">
                <Input
                  type="number"
                  min={0}
                  value={draft.sortOrder}
                  onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })}
                />
              </Field>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                />
                Show on Discover Salons
              </label>
            </div>
            {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="dark" loading={saving}>
                {mode === 'edit' ? 'Save changes' : 'Add banner'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {mode === 'delete' && selected ? (
        <Modal title="Delete banner" onClose={close}>
          <p className="text-sm text-muted">Remove “{selected.title}” from the guest app?</p>
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
