import type { CryptoWallet } from "../types/wallbit"

type WalletsListProps = {
  wallets: CryptoWallet[]
}

export function WalletsList({ wallets }: WalletsListProps) {
  if (wallets.length === 0) {
    return (
      <text>
        <span fg="#9CA3AF">No crypto wallets available.</span>
      </text>
    )
  }

  const sortedWallets = [...wallets].sort((a, b) => {
    const byCurrency = a.currency_code.localeCompare(b.currency_code)
    if (byCurrency !== 0) {
      return byCurrency
    }

    return a.network.localeCompare(b.network)
  })

  return (
    <box flexDirection="column">
      {sortedWallets.slice(0, 6).map((wallet) => (
        <box key={`${wallet.currency_code}-${wallet.network}-${wallet.address}`} marginBottom={1}>
          <text>
            <span fg="#60A5FA">{wallet.currency_code}</span>
            <span fg="#9CA3AF"> {wallet.network}</span>
            <br />
            <span fg="#D1D5DB">{truncateAddress(wallet.address)}</span>
          </text>
        </box>
      ))}
    </box>
  )
}

function truncateAddress(address: string): string {
  if (address.length <= 22) {
    return address
  }

  return `${address.slice(0, 10)}...${address.slice(-8)}`
}
