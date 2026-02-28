import type { StockBalance } from "../types/wallbit"

type StocksListProps = {
  stocks: StockBalance[]
}

const sharesFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
})

export function StocksList({ stocks }: StocksListProps) {
  if (stocks.length === 0) {
    return (
      <text>
        <span fg="#9CA3AF">No positions in portfolio.</span>
      </text>
    )
  }

  const sortedStocks = [...stocks].sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, 8)

  return (
    <box flexDirection="column">
      {sortedStocks.map((stock) => {
        const shares = parseShares(stock.shares)
        return (
          <text key={stock.symbol}>
            <span fg="#93C5FD">{stock.symbol.padEnd(8, " ")}</span>
            <span fg="#E5E7EB">{shares === null ? "-" : sharesFormatter.format(shares)}</span>
          </text>
        )
      })}
    </box>
  )
}

function parseShares(value: number | string): number | null {
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
