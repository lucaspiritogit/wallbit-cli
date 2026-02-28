import type { CryptoWallet } from "../types/wallbit"
import { sortWallets, truncateWalletAddress } from "../utils/wallets"

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

  const sortedWallets = sortWallets(wallets)

  return (
    <box flexDirection="column">
      {sortedWallets.slice(0, 6).map((wallet) => (
        <box key={`${wallet.currency_code}-${wallet.network}-${wallet.address}`} marginBottom={1}>
          <text>
            <span fg="#60A5FA">{wallet.currency_code}</span>
            <span fg="#9CA3AF"> {wallet.network}</span>
            <br />
            <span fg="#D1D5DB">{truncateWalletAddress(wallet.address)}</span>
          </text>
        </box>
      ))}
    </box>
  )
}
