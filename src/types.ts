export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SALON_ADMIN: 'SALON_ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
  tenantId: string | null
  tenant?: { id: string; name: string; slug: string } | null
  staffProfileId?: string | null
}

export type Tenant = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  description: string | null
  timezone: string
  openingTime: string
  closingTime: string
  slotIntervalMinutes: number
  brandColor: string
  isActive: boolean
}

export type SalonService = {
  id: string
  name: string
  description: string | null
  category: string
  durationMinutes: number
  price: string
  isActive: boolean
}

export type PublicStaff = {
  id: string
  firstName: string
  lastName: string
  specialty: string | null
  bio: string | null
  serviceIds: string[]
}

export type PublicSalon = Tenant & {
  services: SalonService[]
  staff: PublicStaff[]
}

export type Slot = {
  startAt: string
  endAt: string
  staffId: string
  staffName: string
}

export const PaymentStatus = {
  DUE: 'DUE',
  CREATED: 'CREATED',
  PAID: 'PAID',
  FAILED: 'FAILED',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export type Payment = {
  id: string
  status: PaymentStatus
  amountPaise: number
  currency: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: string
}

export type Booking = {
  id: string
  startAt: string
  endAt: string
  status: BookingStatus
  notes: string | null
  payment?: Payment | null
  service?: SalonService
  staff?: {
    id: string
    user?: { firstName: string; lastName: string }
  }
  customer?: { firstName: string; lastName: string; email: string }
  tenant?: { name: string; slug: string }
}
