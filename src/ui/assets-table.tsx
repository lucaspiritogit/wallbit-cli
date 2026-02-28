import type { Asset } from "../types/wallbit"

type AssetsTableProps = {
  assets: Asset[]
  selectedIndex: number
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COLUMN_WIDTHS = {
  symbol: 8,
  price: 10,
  type: 10,
  exchange: 10,
}

export function AssetsTable({ assets, selectedIndex }: AssetsTableProps) {
  if (assets.length === 0) {
    return (
      <text>
        <span fg="#9CA3AF">No assets available.</span>
      </text>
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexDirection="row" width="100%" marginBottom={1}>
        <box width={COLUMN_WIDTHS.symbol}>
          <text fg="#93C5FD" content="SYMBOL" />
        </box>
        <box flexGrow={1}>
          <text fg="#93C5FD" content="NAME" />
        </box>
        <box width={COLUMN_WIDTHS.price}>
          <text fg="#93C5FD" content="PRICE" />
        </box>
        <box width={COLUMN_WIDTHS.type}>
          <text fg="#93C5FD" content="TYPE" />
        </box>
        <box width={COLUMN_WIDTHS.exchange}>
          <text fg="#93C5FD" content="EXCHANGE" />
        </box>
      </box>
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        {assets.slice(0, 10).map((asset, index) => (
          <box
            key={asset.symbol}
            flexDirection="row"
            width="100%"
            minHeight={2}
            backgroundColor={index === selectedIndex ? "#1F2937" : undefined}
          >
            <box width={COLUMN_WIDTHS.symbol}>
              <text fg={index === selectedIndex ? "#93C5FD" : "#E5E7EB"} content={`${index === selectedIndex ? ">" : " "}${clip(asset.symbol, COLUMN_WIDTHS.symbol - 1)}`} />
            </box>
            <box flexGrow={1}>
              <text fg="#D1D5DB" content={clip(asset.name, 24)} />
            </box>
            <box width={COLUMN_WIDTHS.price}>
              <text fg="#E5E7EB" content={formatPrice(asset.price)} />
            </box>
            <box width={COLUMN_WIDTHS.type}>
              <text fg="#9CA3AF" content={clip(asset.asset_type ?? "-", COLUMN_WIDTHS.type)} />
            </box>
            <box width={COLUMN_WIDTHS.exchange}>
              <text fg="#9CA3AF" content={clip(asset.exchange ?? "-", COLUMN_WIDTHS.exchange)} />
            </box>
          </box>
        ))}
      </box>
    </box>
  )
}

function formatPrice(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return "-"
  }

  const formatted = `$${priceFormatter.format(numeric)}`
  return clip(formatted, COLUMN_WIDTHS.price)
}

function clip(value: string, width: number): string {
  if (value.length <= width) {
    return value
  }

  if (width <= 3) {
    return value.slice(0, width)
  }

  return `${value.slice(0, width - 3)}...`
}
