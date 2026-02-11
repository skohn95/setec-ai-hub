/**
 * Date utilities for display formatting
 */

const LOCALE = 'es-MX'

/**
 * Format date for display in Spanish format
 * Example: "3 de febrero de 2026"
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format time for display in 24-hour format
 * Example: "14:30h"
 */
export function formatDisplayTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const time = d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${time}h`
}

/**
 * Format date and time for display
 * Example: "3 de febrero de 2026, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "hace 5 minutos", "ayer")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'hace un momento'
  } else if (diffMins < 60) {
    return diffMins === 1 ? 'hace 1 minuto' : `hace ${diffMins} minutos`
  } else if (diffHours < 24) {
    return diffHours === 1 ? 'hace 1 hora' : `hace ${diffHours} horas`
  } else if (diffDays === 1) {
    return 'ayer'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else {
    return formatDisplayDate(d)
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
