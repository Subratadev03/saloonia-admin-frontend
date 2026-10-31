import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { useBookingSync } from '../../lib/realtime'
import { AdminHeading, Panel } from '../../components/admin/panel'
import { Input } from '../../components/ui/input'

type PaymentRow = {
  id: string
  status: 'DUE' | 'CREATED' | 'PAID' | 'FAILED'
  amountPaise: number
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: string
  booking?: {
    startAt: string
    status: string
    service?: { name: string }
    customer?: { firstName: string; lastName: string; email: string }
  } | null
}

const label: Record<PaymentRow['status'], string> = {
  PAID: 'Paid',
  DUE: 'Pay later',
  CREATED: 'Checkout open',
  FAILED: 'Failed',
}

const tone: Record<PaymentRow['status'], string> = {
  PAID: 'bg-[#dcecd6] text-[#245532]',
  DUE: 'bg-[#f6e7c4] text-[#6d5014]',
  CREATED: 'bg-[#efe4d4] text-[#6a5340]',
  FAILED: 'bg-[#f6d9d6] text-[#7a3030]',
}

function formatMoney(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | PaymentRow['status']>('all')
  const tick = useBookingSync((state) => state.tick)

  useEffect(() => {
    api.get<PaymentRow[]>('/payments').then(({ data }) => setRows(data))
  }, [tick])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false
      if (!needle) return true
      const guest = `${row.booking?.customer?.firstName ?? ''} ${row.booking?.customer?.lastName ?? ''} ${row.booking?.customer?.email ?? ''}`
      const haystack = `${guest} ${row.booking?.service?.name ?? ''} ${row.razorpayPaymentId ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [filter, query, rows])

  const paid = rows.filter((row) => row.status === 'PAID').reduce((sum, row) => sum + row.amountPaise, 0)
  const due = rows.filter((row) => row.status === 'DUE').reduce((sum, row) => sum + row.amountPaise, 0)

  return (
    <div>
      <AdminHeading
        kicker="Desk"
        title="Payments"
        subtitle="Razorpay charges and visits the guest chose to pay later."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-sm text-muted">Collected online</p>
          <p className="mt-1 font-serif text-3xl">{formatMoney(paid)}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted">Pay later</p>
          <p className="mt-1 font-serif text-3xl">{formatMoney(due)}</p>
        </Panel>
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guest, service, or payment id"
            aria-label="Search payments"
            className="max-w-sm"
          />
          {(['all', 'PAID', 'DUE', 'CREATED', 'FAILED'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === option ? 'bg-[#1c1917] text-white' : 'bg-[#f6f1ea] text-ink'}`}
            >
              {option === 'all' ? 'All' : label[option]}
            </button>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">When</th>
                <th className="py-2 pr-3 font-semibold">Guest</th>
                <th className="py-2 pr-3 font-semibold">Visit</th>
                <th className="py-2 pr-3 font-semibold">Amount</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 font-semibold">Razorpay</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-muted">
                    No payments match this view.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-t border-[#f0ebe4]">
                    <td className="py-3 pr-3">{new Date(row.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="py-3 pr-3">
                      <p className="font-semibold">
                        {row.booking?.customer?.firstName} {row.booking?.customer?.lastName}
                      </p>
                      <p className="text-muted">{row.booking?.customer?.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{row.booking?.service?.name ?? 'Visit'}</p>
                      <p className="text-muted">
                        {row.booking ? new Date(row.booking.startAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                      </p>
                    </td>
                    <td className="py-3 pr-3 font-semibold">{formatMoney(row.amountPaise)}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[row.status]}`}>{label[row.status]}</span>
                    </td>
                    <td className="max-w-[180px] break-all py-3 text-xs text-muted">{row.razorpayPaymentId || row.razorpayOrderId || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
