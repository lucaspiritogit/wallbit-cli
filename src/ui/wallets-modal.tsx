import type { CryptoWallet } from "../types/wallbit"
import { sortWallets, truncateWalletAddress } from "../utils/wallets"

type WalletsModalStatusType = "idle" | "success" | "error"

type WalletsModalProps = {
  wallets: CryptoWallet[]
  selectedIndex: number
  statusType: WalletsModalStatusType
  statusMessage: string
  onSelectionChange: (index: number) => void
  onCopySelected: (index: number) => void
}

export function WalletsModal({
  wallets,
  selectedIndex,
  statusType,
  statusMessage,
  onSelectionChange,
  onCopySelected,
}: WalletsModalProps) {
  const sortedWallets = sortWallets(wallets)

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
            <select
              focused
              width="100%"
              height="100%"
              flexGrow={1}
              selectedIndex={selectedIndex}
              textColor="#D1D5DB"
              focusedTextColor="#E5E7EB"
              selectedTextColor="#93C5FD"
              descriptionColor="#9CA3AF"
              selectedDescriptionColor="#60A5FA"
              selectedBackgroundColor="#1F2937"
              options={sortedWallets.map((wallet) => ({
                name: `${wallet.currency_code} ${wallet.network}`,
                description: truncateWalletAddress(wallet.address),
              }))}
              onChange={(index) => onSelectionChange(index)}
              onSelect={() => onCopySelected(selectedIndex)}
            />
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
            <span fg="#6B7280">up/down select  enter/c copy  esc close</span>
          </text>
        </box>
      </box>
    </box>
  )
}
