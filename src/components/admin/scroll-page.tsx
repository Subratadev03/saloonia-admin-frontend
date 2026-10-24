import { useEffect, useState, type UIEvent } from 'react'
import { Input } from '../ui/input'

const PAGE_SIZE = 5

export function useScrollPages<T>(items: T[], resetKey: string) {
  const [count, setCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setCount(PAGE_SIZE)
  }, [resetKey])

  const visible = items.slice(0, count)
  const hasMore = count < items.length

  function onScroll(event: UIEvent<HTMLDivElement>) {
    if (!hasMore) return
    const element = event.currentTarget
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 40
    if (nearBottom) {
      setCount((current) => Math.min(current + PAGE_SIZE, items.length))
    }
  }

  function showMore() {
    setCount((current) => Math.min(current + PAGE_SIZE, items.length))
  }

  return { visible, hasMore, shown: visible.length, total: items.length, onScroll, showMore }
}

export function TableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="border-b border-[#f0ebe4] px-4 py-3">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

export function ScrollStatus({
  shown,
  total,
  hasMore,
  onShowMore,
}: {
  shown: number
  total: number
  hasMore: boolean
  onShowMore: () => void
}) {
  if (total === 0) {
    return null
  }
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#f0ebe4] px-4 py-3 text-sm text-muted">
      <p>
        Showing {shown} of {total}
      </p>
      {hasMore ? (
        <button type="button" className="font-semibold text-ink underline" onClick={onShowMore}>
          Show more
        </button>
      ) : (
        <p>End of the list</p>
      )}
    </div>
  )
}
