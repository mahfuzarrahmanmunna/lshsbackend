export const normalizeEmail = (email?: string | null): string | null => {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed || null
}

export const normalizePhone = (phone?: string | null): string | null => {
  if (!phone) return null
  const trimmed = phone.trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[^\d+\s-]/g, '')
  return cleaned || null
}