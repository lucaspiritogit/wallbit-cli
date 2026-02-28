export type AgentChatRole = "user" | "assistant" | "system"

export type AgentChatMessage = {
  id: string
  role: AgentChatRole
  content: string
  toolsUsed?: string[]
}

type AgentChatPanelProps = {
  messages: AgentChatMessage[]
  inputValue: string
  onInputValueChange: (value: string) => void
  onInputSubmit: (value: string) => void
  isFocused: boolean
  isLoading: boolean
  error: string | null
  visibleRows: number
  scrollOffset: number
}

type ChatLine = {
  id: string
  role: AgentChatRole | "meta"
  content: string
}

function wrapLine(value: string, maxWidth: number): string[] {
  const text = value.trimEnd()
  if (!text) {
    return [""]
  }

  const chunks = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ""

  for (const chunk of chunks) {
    if (chunk.length <= maxWidth) {
      if (!currentLine) {
        currentLine = chunk
        continue
      }

      if (currentLine.length + 1 + chunk.length <= maxWidth) {
        currentLine = `${currentLine} ${chunk}`
      } else {
        lines.push(currentLine)
        currentLine = chunk
      }
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = ""
    }

    let cursor = 0
    while (cursor < chunk.length) {
      lines.push(chunk.slice(cursor, cursor + maxWidth))
      cursor += maxWidth
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [""]
}

function toWrappedLines(value: string, maxWidth: number): string[] {
  return value
    .split(/\r?\n/)
    .flatMap((line) => {
      const wrapped = wrapLine(line, maxWidth)
      return wrapped.length > 0 ? wrapped : [""]
    })
}

export function AgentChatPanel({
  messages,
  inputValue,
  onInputValueChange,
  onInputSubmit,
  isFocused,
  isLoading,
  error,
  visibleRows,
  scrollOffset,
}: AgentChatPanelProps) {
  const messageWidth = 48
  const handleInputSubmit = (value: string | object) => {
    if (typeof value === "string") {
      onInputSubmit(value)
      return
    }

    onInputSubmit(inputValue)
  }

  const allLines = messages.flatMap<ChatLine>((message) => {
    const contentLines = toWrappedLines(message.content, messageWidth)
    const toolLines =
      message.toolsUsed && message.toolsUsed.length > 0
        ? toWrappedLines(`tools: ${message.toolsUsed.join(", ")}`, messageWidth).map((line, index) => ({
            id: `${message.id}-tools-${index}`,
            role: "meta" as const,
            content: line,
          }))
        : []

    return [
      {
        id: `${message.id}-head`,
        role: message.role,
        content: `${message.role === "assistant" ? "agent" : message.role === "user" ? "you" : "system"}:`,
      },
      ...contentLines.map((line, index) => ({
        id: `${message.id}-content-${index}`,
        role: "meta" as const,
        content: line,
      })),
      ...toolLines,
      {
        id: `${message.id}-space`,
        role: "meta" as const,
        content: "",
      },
    ]
  })

  const maxOffset = Math.max(0, allLines.length - visibleRows)
  const effectiveOffset = Math.min(scrollOffset, maxOffset)
  const start = Math.max(0, allLines.length - visibleRows - effectiveOffset)
  const end = start + visibleRows
  const visibleLines = allLines.slice(start, end)

  return (
    <box border padding={1} marginRight={1} flexDirection="column" width={52} height="100%">
      <box flexDirection="row" justifyContent="space-between" width="100%">
        <text>
          <strong>Agent Chat</strong>
        </text>
        <text>
          <span fg={isFocused ? "#93C5FD" : "#9CA3AF"}>{isFocused ? "Focused" : "Press c"}</span>
        </text>
      </box>
      <box marginTop={1} flexDirection="column" flexGrow={1} overflow="hidden">
        {messages.length === 0 ? (
          <text>
            <span fg="#9CA3AF">Explore financial insights just for you.</span>
          </text>
        ) : (
          visibleLines.map((line) => (
            <text key={line.id}>
              <span
                fg={
                  line.role === "assistant"
                    ? "#93C5FD"
                    : line.role === "user"
                      ? "#E5E7EB"
                      : line.role === "system"
                        ? "#9CA3AF"
                        : "#D1D5DB"
                }
              >
                {line.content}
              </span>
            </text>
          ))
        )}
      </box>
      <box marginTop={1} border flexDirection="column" padding={1}>
        <input
          value={inputValue}
          focused={isFocused}
          placeholder="press c to type..."
          maxLength={600}
          width={46}
          textColor="#D1D5DB"
          backgroundColor="#111827"
          focusedBackgroundColor="#1F2937"
          cursorColor="#93C5FD"
          onInput={onInputValueChange}
          onSubmit={handleInputSubmit}
        />
      </box>
      {error ? (
        <box marginTop={1}>
          <text>
            <span fg="#FCA5A5">{error}</span>
          </text>
        </box>
      ) : null}
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">{isLoading ? "Agent is thinking..." : ""}</span>
        </text>
      </box>
    </box>
  )
}
