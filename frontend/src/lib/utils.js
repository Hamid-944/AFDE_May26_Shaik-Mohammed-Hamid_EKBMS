import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelative(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const STATUS_CONFIG = {
  Draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600 border border-slate-200' },
  'Pending Approval': { label: 'Pending', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  Rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700 border border-red-200' },
  Published: { label: 'Published', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
  Archived: { label: 'Archived', class: 'bg-gray-50 text-gray-500 border border-gray-200' },
}

export const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700',
  Author: 'bg-indigo-100 text-indigo-700',
  Reviewer: 'bg-teal-100 text-teal-700',
  Employee: 'bg-sky-100 text-sky-700',
}
