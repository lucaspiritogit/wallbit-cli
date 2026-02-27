import type { Transaction } from "../types/wallbit"

type TransactionsListProps = {
  transactions: Transaction[]
  hidden: boolean
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COLUMN_WIDTHS = {
  direction: 3,
  date: 10,
  amount: 12,
  currency: 5,
  type: 20,
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
    <box flexDirection="column">
      {latestTransactions.map((transaction) => {
        const currency = transaction.dest_currency?.code ?? transaction.source_currency?.code ?? "-"
        const destAmount = parseAmount(transaction.dest_amount)
        const sourceAmount = parseAmount(transaction.source_amount)
        const amount = destAmount ?? sourceAmount
        const transactionType = getTransactionType(transaction)
        const direction = getTransactionDirection(destAmount, sourceAmount, transactionType)
        const formattedAmount = amount === null ? "-" : amountFormatter.format(amount)
        const amountText = hidden ? maskAmount(formattedAmount) : formattedAmount
        const typeText = clipText(transactionType, COLUMN_WIDTHS.type)

        return (
          <box key={transaction.uuid} flexDirection="row" width="100%">
            <box width={COLUMN_WIDTHS.direction} justifyContent="center" alignItems="center">
              <text fg={getDirectionColor(direction)} content={getDirectionArrow(direction)} />
            </box>
            <box width={COLUMN_WIDTHS.date}>
              <text fg="#D1D5DB" content={formatDate(transaction.created_at)} />
            </box>
            <box width={COLUMN_WIDTHS.amount} paddingLeft={1}>
              <text fg="#E5E7EB" content={amountText} />
            </box>
            <box width={COLUMN_WIDTHS.currency}>
              <text>
                <span fg={getCurrencyColor(currency)}>{currency}</span>
              </text>
            </box>
            <box width={COLUMN_WIDTHS.type}>
              <text fg="#60A5FA" content={typeText} />
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

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "invalid-date"
  }

  return date.toISOString().slice(0, 10)
}

function getCurrencyColor(currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase()

  if (normalizedCurrency === "USD") {
    return "#22C55E"
  }

  if (normalizedCurrency === "ARS") {
    return "#dfec29"
  }

  if (normalizedCurrency === "USDC") {
    return "#2775CA"
  }

  if (normalizedCurrency === "EUR") {
    return "#1E3A8A"
  }

  return "#9CA3AF"
}

function clipText(value: string, width: number): string {
  if (value.length <= width) {
    return value
  }

  if (width <= 3) {
    return value.slice(0, width)
  }

  return `${value.slice(0, width - 3)}...`
}

function maskAmount(value: string): string {
  return value.replace(/[0-9]/g, "*")
}
