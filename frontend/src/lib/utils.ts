/**
 * PayGuard – Utility Functions
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format currency in INR */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a date for display */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

/** Get risk badge class */
export function getRiskBadgeClass(level: string): string {
  switch (level) {
    case "safe":
      return "badge-safe"
    case "medium":
      return "badge-medium"
    case "fraud":
      return "badge-fraud"
    default:
      return "badge-safe"
  }
}

/** Get risk color for charts */
export function getRiskColor(level: string): string {
  switch (level) {
    case "safe":
      return "#10b981"
    case "medium":
      return "#f59e0b"
    case "fraud":
      return "#ef4444"
    default:
      return "#94a3b8"
  }
}
