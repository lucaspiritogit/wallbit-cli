type AuthScreenProps = {
  authInput: string
  authMode: "wallbit" | "ai-provider" | "openai-key"
  aiProviderSelectionIndex: number
  openAiAvailable: boolean
  openAiKeyLoaded: boolean
  authError: string | null
  onAiProviderChange: (index: number) => void
  onAiProviderSubmit: () => void
}

export function AuthScreen(props: AuthScreenProps) {
  const title =
    props.authMode === "wallbit" ? "Wallbit API key" : props.authMode === "openai-key" ? "OpenAI API key" : "AI capabilities"
  const helperText =
    props.authMode === "wallbit"
      ? "Paste your Wallbit API key and press enter to access your dashboard"
      : props.authMode === "openai-key"
        ? "Paste your OpenAI API key, press enter to save it to keychain, and continue"
      : "You can optionally enable AI capabilities to interact with the agent (beta)."

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
        {props.authMode === "wallbit" || props.authMode === "openai-key" ? (
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
                  name: "Continue without AI",
                  description: "Disable agent chat",
                },
                {
                  name: "OpenAI",
                  description: "ChatGPT API Key",
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
