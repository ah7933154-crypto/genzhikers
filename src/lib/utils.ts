import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export function generateMembershipId(): string {
  const prefix = "GZH"
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0")
  return `${prefix}${year}${random}`
}

export function isFeedbackWindowOpen(): boolean {
  const now = new Date()
  // Get Pakistan Standard Time (UTC+5)
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  const day = pkt.getUTCDay() // 0 = Sunday
  const hour = pkt.getUTCHours()
  const minute = pkt.getUTCMinutes()
  return day === 0 && (hour > 16 || (hour === 16 && minute >= 0))
}

export function getNextFeedbackWindow(): Date {
  const now = new Date()
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  const day = pkt.getUTCDay()
  
  // Days until next Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day
  const nextSunday = new Date(pkt)
  nextSunday.setUTCDate(pkt.getUTCDate() + daysUntilSunday)
  nextSunday.setUTCHours(16, 0, 0, 0)
  
  // Convert back to local time
  return new Date(nextSunday.getTime() - 5 * 60 * 60 * 1000)
}

export const DIFFICULTY_COLORS = {
  easy: "text-green-600 bg-green-50",
  moderate: "text-yellow-600 bg-yellow-50",
  difficult: "text-orange-600 bg-orange-50",
  extreme: "text-red-600 bg-red-50",
}

export const DIFFICULTY_LABELS = {
  easy: "Easy",
  moderate: "Moderate",
  difficult: "Difficult",
  extreme: "Extreme",
}

export const ROLES = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  senior_member: "Senior Member",
  executive: "Executive Council Member",
  organizer: "Event Organizer",
  moderator: "Moderator",
  verified_member: "Verified Member",
  member: "General Member",
} as const

export type Role = keyof typeof ROLES
