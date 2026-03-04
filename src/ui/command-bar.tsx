type CommandBarProps = {
  value: string
  onInputChange: (value: string) => void
  onSubmit: (value: string) => void
  focused: boolean
  enabled: boolean
  loading: boolean
  statusMessage: string | null
  statusType: "info" | "error" | "success"
}

export function CommandBar({
  value,
  onInputChange,
  onSubmit,
  focused,
  enabled,
  loading,
  statusMessage,
  statusType,
}: CommandBarProps) {
  const handleInputSubmit = (submittedValue: string | object) => {
    if (typeof submittedValue === "string") {
      onSubmit(submittedValue)
      return
    }

    onSubmit(value)
  }

  const statusColor = statusType === "error" ? "#FCA5A5" : statusType === "success" ? "#86EFAC" : "#9CA3AF"

  return (
    <box border padding={1} flexDirection="column" width="100%">
      <box flexDirection="row" justifyContent="space-between" width="100%">
        <text>
          <strong>Command</strong>
        </text>
        <text>
          <span fg="#6B7280">Use ! for actions, ? for agent, Ctrl+J toggles chat</span>
        </text>
      </box>
      <box marginTop={1} width="100%">
        <input
          value={value}
          focused={focused}
          // placeholder={enabled ? "Type !buy BTC 200 or ?what changed today" : "Command mode is available on the dashboard"}
          maxLength={600}
          width="100%"
          textColor="#D1D5DB"
          backgroundColor="#111827"
          focusedBackgroundColor="#1F2937"
          cursorColor="#93C5FD"
          onInput={onInputChange}
          onSubmit={handleInputSubmit}
        />
      </box>
      <box marginTop={1}>
        <text>
          <span fg={statusColor}>{loading ? "Agent is thinking..." : statusMessage ?? ""}</span>
        </text>
      </box>
    </box>
  )
}
