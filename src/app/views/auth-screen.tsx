type AuthScreenProps = {
  authInput: string
  authMode: "wallbit" | "ai-provider"
  aiProviderSelectionIndex: number
  openAiAvailable: boolean
  openAiKeyLoaded: boolean
  authError: string | null
  onAiProviderChange: (index: number) => void
  onAiProviderSubmit: () => void
}

export function AuthScreen(props: AuthScreenProps) {
  const title = props.authMode === "wallbit" ? "Wallbit API key" : "AI capabilities"
  const helperText =
    props.authMode === "wallbit"
      ? "Paste your Wallbit API key and press enter to access your dashboard"
      : "Select AI provider. Choose no AI to enter dashboard without chat."

  return (
    <box flexDirection="column" alignItems="center">
      <box marginTop={3}>
        <text>
          <span fg="#4B5563">Wallbit CLI community project - not affiliated with Wallbit</span>
        </text>
      </box>
      <box marginTop={1}>
        <text>
          <span fg="#93C5FD">{title}</span>
        </text>
      </box>
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">{helperText}</span>
        </text>
      </box>
      <box marginTop={1}>
        {props.authMode === "wallbit" ? (
          <text>
            <span fg="#E5E7EB">{`> ${"*".repeat(props.authInput.length)}|`}</span>
          </text>
        ) : (
          <box flexDirection="column">
            <select
              focused
              width={48}
              height={4}
              textColor="#D1D5DB"
              focusedTextColor="#E5E7EB"
              selectedTextColor="#93C5FD"
              descriptionColor="#9CA3AF"
              selectedDescriptionColor="#60A5FA"
              selectedBackgroundColor="#1F2937"
              selectedIndex={props.aiProviderSelectionIndex}
              options={[
                {
                  name: "OpenAI",
                  description: props.openAiAvailable
                    ? "ready"
                    : props.openAiKeyLoaded
                      ? "key missing"
                      : "checking keychain",
                },
                {
                  name: "Continue without AI",
                  description: "disable agent chat",
                },
              ]}
              onChange={(index) => props.onAiProviderChange(index)}
              onSelect={() => props.onAiProviderSubmit()}
            />
            <box marginTop={1}>
              <text>
                <span fg="#6B7280">up/down choose  enter confirm</span>
              </text>
            </box>
          </box>
        )}
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
