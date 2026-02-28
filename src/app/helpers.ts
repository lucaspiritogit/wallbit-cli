import type { AccountDetails } from "../types/wallbit"

export type AppKeyInput = {
  name: string
  shift: boolean
  sequence: string
}

export function isHelpShortcut(key: AppKeyInput): boolean {
  return key.sequence === "?" || (key.name === "slash" && key.shift)
}

export function getPrintableText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "")
}

export function formatAssetPrice(value: number | string | undefined): string {
  if (typeof value === "undefined") {
    return "-"
  }

  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return "-"
  }

  return `$${numeric.toFixed(2)}`
}

export function clipText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength)
  }

  return `${value.slice(0, maxLength - 3)}...`
}

export function getUserSummary(accountDetails: AccountDetails | null): string {
  if (accountDetails === null) {
    return ""
  }

  const holderName = accountDetails.holder_name?.trim() || "-"
  return holderName
}

export function isThrottleWindowElapsed(lastTriggeredAtRef: { current: number }, throttleMs: number): boolean {
  const now = Date.now()
  if (now - lastTriggeredAtRef.current < throttleMs) {
    return false
  }

  lastTriggeredAtRef.current = now
  return true
}
