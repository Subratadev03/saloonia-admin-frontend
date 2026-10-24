import { BookingStatus, type BookingStatus as BookingStatusType } from '../../types'

export const statusTone: Record<BookingStatusType, string> = {
  [BookingStatus.CONFIRMED]: 'bg-[#dcecd6] text-[#245532] border-[#c5dcbd]',
  [BookingStatus.PENDING]: 'bg-[#f6e7c4] text-[#6d5014] border-[#ead39a]',
  [BookingStatus.COMPLETED]: 'bg-[#ece7e1] text-[#4d463f] border-[#ddd6ce]',
  [BookingStatus.CANCELLED]: 'bg-[#f6d9d6] text-[#7a3030] border-[#ecc4bf]',
  [BookingStatus.NO_SHOW]: 'bg-[#efe4d4] text-[#6a5340] border-[#e2d2bb]',
}

export function sameDay(iso: string, day: Date) {
  const value = new Date(iso)
  return (
    value.getFullYear() === day.getFullYear() &&
    value.getMonth() === day.getMonth() &&
    value.getDate() === day.getDate()
  )
}

export function startOfDay(day: Date) {
  const copy = new Date(day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function formatDay(day: Date) {
  return day.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
