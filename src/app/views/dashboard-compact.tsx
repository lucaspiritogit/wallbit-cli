import type { ReactNode } from "react"
import type { AppState } from "../types"
import { StocksList } from "../../ui/stocks-list"
import { TransactionsList } from "../../ui/transactions-list"
import { WalletsList } from "../../ui/wallets-list"

type DashboardCompactState = Extract<AppState, { status: "success" }>

type DashboardCompactProps = {
  body: ReactNode
  state: DashboardCompactState
  hideValues: boolean
  showExtendedContent: boolean
}

export function DashboardCompact(props: DashboardCompactProps) {
  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      <box border padding={1} flexDirection="column">
        <box flexDirection="row" justifyContent="space-between" width="100%">
          <text>
            <strong>Checking Balance</strong>
          </text>
          <text>
            <span fg="#6B7280">h to hide all</span>
          </text>
        </box>
        <box marginTop={1}>{props.body}</box>
      </box>
      {props.showExtendedContent ? (
        <>
          <box border padding={1} marginTop={1} flexDirection="column">
            <box flexDirection="row" justifyContent="space-between" width="100%">
              <text>
                <strong>Crypto Wallets</strong>
              </text>
            </box>
            <box marginTop={1}>
              <WalletsList wallets={props.state.wallets} />
            </box>
          </box>
          <box border padding={1} marginTop={1} flexDirection="column">
            <box flexDirection="row" justifyContent="space-between" width="100%">
              <text>
                <strong>Latest Transactions</strong>
              </text>
              <text>
                <span fg="#6B7280">h to hide  Page {props.state.transactionsPage}/{props.state.transactionsTotalPages}</span>
              </text>
            </box>
            <box marginTop={1}>
              {props.state.transactionsLoading ? (
                <text>
                  <span fg="#93C5FD">Loading transactions page...</span>
                </text>
              ) : props.state.transactionsError ? (
                <text>
                  <span fg="#FCA5A5">{props.state.transactionsError}</span>
                </text>
              ) : (
                <TransactionsList transactions={props.state.transactions} hidden={props.hideValues} />
              )}
            </box>
          </box>
          <box border padding={1} marginTop={1} flexDirection="column">
            <text>
              <strong>Stocks Portfolio</strong>
            </text>
            <box marginTop={1}>
              <StocksList stocks={props.state.stocks} />
            </box>
          </box>
        </>
      ) : (
        <box marginTop={1}>
          <text>
            <span fg="#9CA3AF">Compact mode: enlarge terminal height to see wallets, transactions, and stocks.</span>
          </text>
        </box>
      )}
    </box>
  )
}
