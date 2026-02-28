import type { ReactNode } from "react"
import { getUserSummary } from "../helpers"
import type { AppState } from "../types"
import { AgentChatPanel } from "../../ui/agent-chat-panel"
import type { AgentChatMessage } from "../../ui/agent-chat-panel"
import { StocksList } from "../../ui/stocks-list"
import { TransactionsList } from "../../ui/transactions-list"
import { WalletsList } from "../../ui/wallets-list"

type DashboardState = Extract<AppState, { status: "loading" } | { status: "success" }>

type DashboardFullProps = {
  body: ReactNode
  state: DashboardState
  hideValues: boolean
  showLogo: boolean
  showAgentChat: boolean
  aiStatusLabel: string
  chatMessages: AgentChatMessage[]
  chatInput: string
  onChatInputChange: (value: string) => void
  onChatInputSubmit: (value: string) => void
  chatFocused: boolean
  chatLoading: boolean
  chatError: string | null
  chatVisibleRows: number
  chatScrollOffset: number
}

export function DashboardFull(props: DashboardFullProps) {
  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {props.showLogo ? (
        <box width="100%" flexDirection="row" justifyContent="space-between">
          <text>
            <span fg="#3B82F6">Wallbit</span>
            <span fg="#9CA3AF"> account of {props.state.status === "success" ? getUserSummary(props.state.accountDetails) : "-"}</span>
          </text>
          <text>
            <span fg="#6B7280">AI: {props.aiStatusLabel}</span>
          </text>
        </box>
      ) : null}
      <box flexDirection="row" width="100%" flexGrow={1} alignItems="flex-start" marginTop={props.showLogo ? 1 : 0}>
        {props.showAgentChat ? (
          <AgentChatPanel
            messages={props.chatMessages}
            inputValue={props.chatInput}
            onInputValueChange={props.onChatInputChange}
            onInputSubmit={props.onChatInputSubmit}
            isFocused={props.chatFocused}
            isLoading={props.chatLoading}
            error={props.chatError}
            visibleRows={props.chatVisibleRows}
            scrollOffset={props.chatScrollOffset}
          />
        ) : null}
        <box flexDirection="column" flexGrow={1} minWidth={56} height="100%">
          <box flexDirection="row" width="100%">
            <box border padding={1} flexDirection="column" flexGrow={2}>
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
            <box border padding={1} marginLeft={1} flexDirection="column" flexGrow={1} minWidth={28}>
              <box flexDirection="row" justifyContent="space-between" width="100%">
                <text>
                  <strong>Crypto Wallets</strong>
                </text>
              </box>
              <box marginTop={1}>
                {props.state.status === "loading" ? (
                  <text>
                    <span fg="#93C5FD">Loading wallets...</span>
                  </text>
                ) : (
                  <WalletsList wallets={props.state.wallets} />
                )}
              </box>
            </box>
          </box>
          <box border padding={1} marginTop={1} flexDirection="column" flexGrow={1}>
            <box flexDirection="row" justifyContent="space-between" width="100%">
              <text>
                <strong>Latest Transactions</strong>
              </text>
              <text>
                <span fg="#6B7280">
                  {props.state.status === "loading"
                    ? ""
                    : `h to hide  Page ${props.state.transactionsPage}/${props.state.transactionsTotalPages}`}
                </span>
              </text>
            </box>
            <box marginTop={1} flexGrow={1}>
              {props.state.status === "loading" ? (
                <text>
                  <span fg="#93C5FD">Loading transactions...</span>
                </text>
              ) : props.state.transactionsLoading ? (
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
        </box>
        <box border padding={1} marginLeft={1} flexDirection="column" width={24} height="100%">
          <text>
            <strong>Stocks Portfolio</strong>
          </text>
          <box marginTop={1} flexGrow={1}>
            {props.state.status === "loading" ? (
              <text>
                <span fg="#93C5FD">Loading portfolio...</span>
              </text>
            ) : (
              <StocksList stocks={props.state.stocks} />
            )}
          </box>
        </box>
      </box>
    </box>
  )
}
