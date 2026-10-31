import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { useAuthStore } from '../store/auth-store'

export const BOOKING_CHANGED_EVENT = 'booking.changed'
export const SALON_WATCH_EVENT = 'salon:watch'

type SyncState = {
  tick: number
  bump: () => void
}

export const useBookingSync = create<SyncState>((set) => ({
  tick: 0,
  bump: () => set((state) => ({ tick: state.tick + 1 })),
}))

let socket: Socket | null = null
let activeToken = ''

function socketTarget() {
  const configured = import.meta.env.VITE_REALTIME_URL
  return typeof configured === 'string' && configured.length > 0 ? configured : undefined
}

export function realtimeSocket(token: string | null) {
  const nextToken = token ?? ''
  if (!socket) {
    activeToken = nextToken
    const options = {
      path: '/socket.io',
      transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
      auth: { token: nextToken || undefined },
    }
    const target = socketTarget()
    socket = target ? io(target, options) : io(options)
    return socket
  }
  if (activeToken !== nextToken) {
    activeToken = nextToken
    socket.auth = { token: nextToken || undefined }
    socket.disconnect().connect()
  }
  return socket
}

export function subscribeBookingChanges(token: string | null, onChange: () => void) {
  const client = realtimeSocket(token)
  client.on(BOOKING_CHANGED_EVENT, onChange)
  return () => {
    client.off(BOOKING_CHANGED_EVENT, onChange)
  }
}

export function watchSalon(slug: string) {
  const client = socket ?? realtimeSocket(null)
  const join = () => client.emit(SALON_WATCH_EVENT, slug)
  join()
  client.on('connect', join)
  return () => {
    client.off('connect', join)
  }
}

export function RealtimeBridge() {
  const token = useAuthStore((state) => state.token)
  const bump = useBookingSync((state) => state.bump)

  useEffect(() => subscribeBookingChanges(token, bump), [bump, token])

  return null
}
