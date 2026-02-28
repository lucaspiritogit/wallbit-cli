import type { CheckingBalance } from "../types/wallbit"
import { getCurrencyColor } from "../utils/currency-color"

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
        <box key={balance.currency}>
          <text>
            <strong>
              <span fg={getCurrencyColor(balance.currency)}>{balance.currency.padEnd(6, " ")}</span>
            </strong>
            {`$${hidden ? maskAmount(balanceFormatter.format(balance.balance)) : balanceFormatter.format(balance.balance)}`}
          </text>
        </box>
      ))}
    </box>
  )
}

function maskAmount(formattedAmount: string): string {
  return formattedAmount.replace(/[0-9]/g, "*")
}

