import type { CheckingBalance } from "../types/wallbit"

type BalanceListProps = {
  balances: CheckingBalance[]
  hidden: boolean
}

const balanceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function BalanceList({ balances, hidden }: BalanceListProps) {
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

  return (
    <box flexDirection="column">
      {sortedBalances.map((balance) => (
        <text key={balance.currency}>
          <strong>
            <span fg={getCurrencyColor(balance.currency)}>{balance.currency.padEnd(6, " ")}</span>
          </strong>
          {`$${hidden ? maskAmount(balanceFormatter.format(balance.balance)) : balanceFormatter.format(balance.balance)}`}
        </text>
      ))}
    </box>
  )
}

function maskAmount(formattedAmount: string): string {
  return formattedAmount.replace(/[0-9]/g, "*")
}

function getCurrencyColor(currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase()

  if (normalizedCurrency === "USD") {
    return "#22C55E"
  }

  if (normalizedCurrency === "ARS") {
    return "#60A5FA"
  }

  if (normalizedCurrency === "EUR") {
    return "#1E3A8A"
  }

  return "#9CA3AF"
}
