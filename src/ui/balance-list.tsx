import type { AccountDetails, CheckingBalance } from "../types/wallbit"

type BalanceListProps = {
  balances: CheckingBalance[]
  hidden: boolean
  accountDetails: AccountDetails | null
}

const balanceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function BalanceList({ balances, hidden, accountDetails }: BalanceListProps) {
  if (balances.length === 0) {
    return (
      <box>
        <text>
          <span fg="#9CA3AF">No positive balances in checking account.</span>
        </text>
      </box>
    )
  }

  const sortedBalances = [...balances].sort((a, b) => a.currency.localeCompare(b.currency))
  const currentBalance = sortedBalances.find((balance) => balance.currency.toUpperCase() === "USD") ?? sortedBalances[0]
  const currentAmount = hidden ? maskAmount(balanceFormatter.format(currentBalance.balance)) : balanceFormatter.format(currentBalance.balance)
  const isUsdPrimary = currentBalance.currency.toUpperCase() === "USD"
  const primaryAmountColor = isUsdPrimary ? "#22C55E" : "#93C5FD"
  const primaryBalanceLabel = isUsdPrimary ? `USD ${currentAmount}` : `${currentBalance.currency} ${currentAmount}`

  const bankName = accountDetails?.bank_name?.trim() || accountDetails?.bank?.name?.trim() || "-"
  const routingNumber = accountDetails?.routing_number?.trim() || accountDetails?.bank?.routing_number?.trim() || "-"
  const accountNumber = accountDetails?.account_number?.trim() || accountDetails?.bank?.account_number?.trim() || "-"

  return (
    <box flexDirection="column" width="100%">
      <box padding={1} flexDirection="column">
        <text>
          <span fg="#6B7280">Current available balance</span>
        </text>
        <box marginTop={1} flexDirection="row" alignItems="center">
          <text>
            <strong>
              <span fg={primaryAmountColor}>{primaryBalanceLabel}</span>
            </strong>
          </text>
        </box>
        <box marginTop={1}>
          <text>
            <span fg="#9CA3AF">Bank:</span>
            <span fg="#D1D5DB"> {bankName}</span>
            <span fg="#9CA3AF">  Routing:</span>
            <span fg="#D1D5DB"> {routingNumber}</span>
            <span fg="#9CA3AF">  Account:</span>
            <span fg="#D1D5DB"> {maskAccountNumber(accountNumber)}</span>
          </text>
        </box>
      </box>
    </box>
  )
}

function maskAmount(formattedAmount: string): string {
  return formattedAmount.replace(/[0-9]/g, "*")
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber === "-") {
    return accountNumber
  }

  const clean = accountNumber.replace(/\s+/g, "")
  if (clean.length <= 4) {
    return clean
  }

  return `${"*".repeat(clean.length - 4)}${clean.slice(-4)}`
}
