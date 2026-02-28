import type { ReactNode } from "react"

type DashboardCompactProps = {
  body: ReactNode
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
      <box marginTop={1}>
        <text>
          <span fg="#9CA3AF">Compact mode: enlarge terminal to see wallets, transactions, and stocks.</span>
        </text>
      </box>
    </box>
  )
}
