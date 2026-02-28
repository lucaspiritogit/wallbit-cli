type AuthScreenProps = {
  apiKeyInput: string
  authError: string | null
}

export function AuthScreen(props: AuthScreenProps) {
  return (
    <box flexDirection="column" alignItems="center">
      <box marginTop={3}>
        <text>
          <span fg="#4B5563">Wallbit CLI community project - not affiliated with Wallbit</span>
        </text>
      </box>
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">Paste your API key and press enter</span>
        </text>
      </box>
      <box marginTop={1}>
        <text>
          <span fg="#E5E7EB">{`> ${"*".repeat(props.apiKeyInput.length)}|`}</span>
        </text>
      </box>
      {props.authError ? (
        <box marginTop={1}>
          <text>
            <span fg="#FCA5A5">{props.authError}</span>
          </text>
        </box>
      ) : null}
    </box>
  )
}
