import type { CryptoWallet } from "../types/wallbit"
import { sortWallets, truncateWalletAddress } from "../utils/wallets"

type WalletsModalStatusType = "idle" | "success" | "error"

type WalletsModalProps = {
  wallets: CryptoWallet[]
  selectedIndex: number
  scrollOffset: number
  visibleRows: number
  statusType: WalletsModalStatusType
  statusMessage: string
}

export function WalletsModal({
  wallets,
  selectedIndex,
  scrollOffset,
  visibleRows,
  statusType,
  statusMessage,
}: WalletsModalProps) {
  const sortedWallets = sortWallets(wallets)
  const rows = sortedWallets.slice(scrollOffset, scrollOffset + visibleRows)

  return (
    <box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
      <box border width="78%" height="76%" padding={1} flexDirection="column">
        <box flexDirection="row" justifyContent="space-between" width="100%">
          <text>
            <strong>Wallet Addresses</strong>
          </text>
          <text>
            <span fg="#6B7280">{sortedWallets.length} wallets</span>
          </text>
        </box>
        <box marginTop={1} flexDirection="column" flexGrow={1} overflow="hidden">
          {sortedWallets.length === 0 ? (
            <text>
              <span fg="#9CA3AF">No crypto wallets available.</span>
            </text>
          ) : (
            rows.map((wallet, index) => {
              const absoluteIndex = scrollOffset + index
              const selected = absoluteIndex === selectedIndex

              return (
                <box
                  key={`${wallet.currency_code}-${wallet.network}-${wallet.address}`}
                  flexDirection="row"
                  width="100%"
                  backgroundColor={selected ? "#1F2937" : undefined}
                >
                  <text>
                    <span fg={selected ? "#93C5FD" : "#D1D5DB"}>{selected ? ">" : " "}</span>
                    <span fg={selected ? "#60A5FA" : "#93C5FD"}> {wallet.currency_code}</span>
                    <span fg="#9CA3AF"> {wallet.network} </span>
                    <span fg="#D1D5DB">{truncateWalletAddress(wallet.address)}</span>
                  </text>
                </box>
              )
            })
          )}
        </box>
        {statusType !== "idle" ? (
          <box marginTop={1}>
            <text>
              <span fg={statusType === "success" ? "#34D399" : "#FCA5A5"}>{statusMessage}</span>
            </text>
          </box>
        ) : null}
        <box marginTop={1}>
          <text>
            <span fg="#6B7280">up/down select  c/enter copy  esc close</span>
          </text>
        </box>
      </box>
    </box>
  )
}
