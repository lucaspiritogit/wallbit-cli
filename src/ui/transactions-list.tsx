import type { Transaction } from "../types/wallbit"
import { getCurrencyColor } from "../utils/currency-color"

type TransactionsListProps = {
  transactions: Transaction[]
  hidden: boolean
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COLUMN_WIDTHS = {
  direction: 4,
  date: 13,
  amount: 14,
  currency: 9,
  status: 12,
}

export function TransactionsList({ transactions, hidden }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <text>
        <span fg="#9CA3AF">No recent transactions.</span>
      </text>
    )
  }

  const latestTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      <box flexDirection="row" width="100%" marginBottom={1}>
        <box width={COLUMN_WIDTHS.direction} justifyContent="center" alignItems="center">
          <text fg="#93C5FD" content="DIR" />
        </box>
        <box width={COLUMN_WIDTHS.date}>
          <text fg="#93C5FD" content="DATE" />
        </box>
        <box width={COLUMN_WIDTHS.amount} paddingLeft={2}>
          <text fg="#93C5FD" content="AMOUNT" />
        </box>
        <box width={COLUMN_WIDTHS.currency} paddingLeft={1}>
          <text fg="#93C5FD" content="CUR" />
        </box>
        <box width={COLUMN_WIDTHS.status} paddingLeft={1}>
          <text fg="#93C5FD" content="STATUS" />
        </box>
        <box flexGrow={1} paddingLeft={2}>
          <text fg="#93C5FD" content="TYPE" />
        </box>
      </box>
      {latestTransactions.map((transaction) => {
        const currency = transaction.dest_currency?.code ?? transaction.source_currency?.code ?? "-"
        const destAmount = parseAmount(transaction.dest_amount)
        const sourceAmount = parseAmount(transaction.source_amount)
        const amount = destAmount ?? sourceAmount
        const transactionType = getTransactionType(transaction)
        const direction = getTransactionDirection(destAmount, sourceAmount, transactionType)
        const formattedAmount = amount === null ? "-" : amountFormatter.format(amount)
        const amountText = hidden ? maskAmount(formattedAmount) : formattedAmount
        const statusText = normalizeStatus(transaction.status)
        return (
          <box key={transaction.uuid} flexDirection="row" width="100%">
            <box width={COLUMN_WIDTHS.direction} justifyContent="center" alignItems="center">
              <text fg={getDirectionColor(direction)} content={getDirectionArrow(direction)} />
            </box>
            <box width={COLUMN_WIDTHS.date}>
              <text fg="#D1D5DB" content={formatDate(transaction.created_at)} />
            </box>
            <box width={COLUMN_WIDTHS.amount} paddingLeft={2}>
              <text fg="#E5E7EB" content={amountText} />
            </box>
            <box width={COLUMN_WIDTHS.currency} paddingLeft={1}>
              <text>
                <span fg={getCurrencyColor(currency)}>{currency}</span>
              </text>
            </box>
            <box width={COLUMN_WIDTHS.status} paddingLeft={1}>
              <text fg={getStatusColor(statusText)} content={statusText} />
            </box>
            <box flexGrow={1} paddingLeft={2}>
              <text fg="#60A5FA" content={transactionType} />
            </box>
          </box>
        )
      })}
    </box>
  )
}

function parseAmount(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function getTransactionDirection(
  destAmount: number | null,
  sourceAmount: number | null,
  transactionType: string,
): "sending" | "receiving" | "unknown" {
  if (destAmount === 0) {
    return "sending"
  }

  if (sourceAmount === 0) {
    return "receiving"
  }

  const normalizedType = transactionType.toUpperCase()

  if (isSendingType(normalizedType)) {
    return "sending"
  }

  if (isReceivingType(normalizedType)) {
    return "receiving"
  }

  return "unknown"
}

function getTransactionType(transaction: Transaction): string {
  if (typeof transaction.type === "string" && transaction.type.length > 0) {
    return transaction.type
  }

  if (typeof transaction.type_id === "string" && transaction.type_id.length > 0) {
    return transaction.type_id
  }

  if (typeof transaction.type_id === "number") {
    return String(transaction.type_id)
  }

  return "TRANSACTION"
}

function isSendingType(transactionType: string): boolean {
  return (
    transactionType.includes("WITHDRAWAL") ||
    transactionType.includes("PAY") ||
    transactionType.includes("SEND") ||
    transactionType.includes("TRANSFER_OUT") ||
    transactionType.includes("SELL")
  )
}

function isReceivingType(transactionType: string): boolean {
  return (
    transactionType.includes("DEPOSIT") ||
    transactionType.includes("RECEIVE") ||
    transactionType.includes("TRANSFER_IN") ||
    transactionType.includes("REFUND") ||
    transactionType.includes("BUY")
  )
}

function getDirectionArrow(direction: "sending" | "receiving" | "unknown"): string {
  if (direction === "sending") {
    return "↑"
  }

  if (direction === "receiving") {
    return "↓"
  }

  return "-"
}

function getDirectionColor(direction: "sending" | "receiving" | "unknown"): string {
  if (direction === "sending") {
    return "#F87171"
  }

  if (direction === "receiving") {
    return "#22C55E"
  }

  return "#9CA3AF"
}

function normalizeStatus(status: string): string {
  const trimmedStatus = status.trim()
  if (trimmedStatus.length === 0) {
    return "-"
  }

  return trimmedStatus.toUpperCase()
}

function getStatusColor(status: string): string {
  if (status.includes("SUCCESS") || status.includes("COMPLETED")) {
    return "#22C55E"
  }

  if (status.includes("PENDING") || status.includes("PROCESSING")) {
    return "#F59E0B"
  }

  if (status.includes("FAILED") || status.includes("ERROR") || status.includes("REJECTED")) {
    return "#F87171"
  }

  return "#D1D5DB"
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "invalid-date"
  }

  return date.toISOString().slice(0, 10)
}

function maskAmount(value: string): string {
  return value.replace(/[0-9]/g, "*")
}
