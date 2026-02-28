import type { CryptoWallet } from "../types/wallbit"

export function sortWallets(wallets: CryptoWallet[]): CryptoWallet[] {
  return [...wallets].sort((a, b) => {
    const byCurrency = a.currency_code.localeCompare(b.currency_code)
    if (byCurrency !== 0) {
      return byCurrency
    }

    return a.network.localeCompare(b.network)
  })
}

export function truncateWalletAddress(address: string): string {
  if (address.length <= 22) {
    return address
  }

  return `${address.slice(0, 10)}...${address.slice(-8)}`
}
