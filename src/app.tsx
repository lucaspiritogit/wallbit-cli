import { useEffect, useMemo, useRef, useState } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { getCheckingBalance, getLatestTransactions, WallbitRequestError } from "./api/wallbit"
import type { CheckingBalance, Transaction } from "./types/wallbit"
import { BalanceList } from "./ui/balance-list"
import { Logo } from "./ui/logo"
import { TransactionsList } from "./ui/transactions-list"

type AppState =
  | { status: "loading" }
  | {
      status: "success"
      balances: CheckingBalance[]
      transactions: Transaction[]
      transactionsPage: number
      transactionsTotalPages: number
      transactionsLoading: boolean
      transactionsError: string | null
    }
  | { status: "error"; message: string }

const PAGINATION_THROTTLE_MS = 300

export function App() {
  const renderer = useRenderer()
  const [state, setState] = useState<AppState>({ status: "loading" })
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [hideBalances, setHideBalances] = useState(false)
  const [hideTransactions, setHideTransactions] = useState(false)
  const lastPaginationKeyAtRef = useRef(0)

  useKeyboard((key) => {
    const keyName = key.name.toLowerCase()
    const shouldExit = key.name === "escape" || key.name === "q" || (key.ctrl && key.name === "c")

    if (shouldExit) {
      renderer.destroy()
      return
    }

    if (apiKey === null) {
      if (keyName === "enter" || keyName === "return") {
        const enteredApiKey = apiKeyInput.trim()

        if (enteredApiKey.length === 0) {
          setAuthError("API key is required.")
          return
        }

        setAuthError(null)
        setState({ status: "loading" })
        setApiKey(enteredApiKey)
        return
      }

      if (keyName === "backspace" || keyName === "delete") {
        setApiKeyInput((current) => current.slice(0, -1))
        return
      }

      if (!key.ctrl && !key.meta && !key.option) {
        const typedText = getPrintableText(key.sequence)
        if (typedText.length > 0) {
          setApiKeyInput((current) => current + typedText)
          setAuthError(null)
          return
        }
      }

      return
    }

    if (keyName === "h") {
      setHideBalances((current) => !current)
      return
    }

    if (keyName === "t") {
      setHideTransactions((current) => !current)
      return
    }

    if (state.status === "success" && keyName === "right") {
      if (!isThrottleWindowElapsed(lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (state.transactionsLoading || state.transactionsPage >= state.transactionsTotalPages) {
        return
      }

      void loadTransactionsPage(state.transactionsPage + 1)
      return
    }

    if (state.status === "success" && keyName === "left") {
      if (!isThrottleWindowElapsed(lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (state.transactionsLoading || state.transactionsPage <= 1) {
        return
      }

      void loadTransactionsPage(state.transactionsPage - 1)
      return
    }
  })

  useEffect(() => {
    const handlePaste = (event: { text: string }) => {
      if (apiKey !== null) {
        return
      }

      const pastedText = getPrintableText(event.text)
      if (pastedText.length === 0) {
        return
      }

      setApiKeyInput((current) => current + pastedText)
      setAuthError(null)
    }

    renderer.keyInput.on("paste", handlePaste)

    return () => {
      renderer.keyInput.off("paste", handlePaste)
    }
  }, [apiKey, renderer])

  useEffect(() => {
    if (apiKey === null) {
      return
    }

    const activeApiKey = apiKey

    let mounted = true

    async function loadDashboard() {
      try {
        const [balances, transactionsPage] = await Promise.all([
          getCheckingBalance(activeApiKey),
          getLatestTransactions(activeApiKey, 1, 10),
        ])

        if (!mounted) {
          return
        }

        setState({
          status: "success",
          balances,
          transactions: transactionsPage.data,
          transactionsPage: transactionsPage.currentPage,
          transactionsTotalPages: transactionsPage.pages,
          transactionsLoading: false,
          transactionsError: null,
        })
      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof WallbitRequestError) {
          setState({ status: "error", message: error.message })
          return
        }

        if (error instanceof Error) {
          setState({ status: "error", message: error.message })
          return
        }

        setState({ status: "error", message: "Unknown error while loading dashboard." })
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [apiKey])

  async function loadTransactionsPage(page: number): Promise<void> {
    if (apiKey === null) {
      return
    }

    const activeApiKey = apiKey

    setState((current) => {
      if (current.status !== "success") {
        return current
      }

      return {
        ...current,
        transactionsLoading: true,
        transactionsError: null,
      }
    })

    try {
      const nextPage = await getLatestTransactions(activeApiKey, page, 10)

      setState((current) => {
        if (current.status !== "success") {
          return current
        }

        return {
          ...current,
          transactions: nextPage.data,
          transactionsPage: nextPage.currentPage,
          transactionsTotalPages: nextPage.pages,
          transactionsLoading: false,
          transactionsError: null,
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load transactions page."

      setState((current) => {
        if (current.status !== "success") {
          return current
        }

        return {
          ...current,
          transactionsLoading: false,
          transactionsError: message,
        }
      })
    }
  }

  const body = useMemo(() => {
    if (state.status === "loading") {
      return (
        <text>
          <span fg="#93C5FD">Loading dashboard...</span>
        </text>
      )
    }

    if (state.status === "error") {
      return (
        <text>
          <span fg="#FCA5A5">{state.message}</span>
        </text>
      )
    }

    return <BalanceList balances={state.balances} hidden={hideBalances} />
  }, [hideBalances, state])

  return (
    <box flexDirection="column" width="100%" height="100%" padding={1}>
      {apiKey === null ? (
        <box flexDirection="column" alignItems="center" width="100%" height="100%">
          <Logo />
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
              <span fg="#E5E7EB">{`> ${"*".repeat(apiKeyInput.length)}|`}</span>
            </text>
          </box>
          {authError ? (
            <box marginTop={1}>
              <text>
                <span fg="#FCA5A5">{authError}</span>
              </text>
            </box>
          ) : null}
        </box>
      ) : state.status === "error" ? (
        <box flexDirection="column">
          <Logo />
          <box marginTop={1}>
            <text>
              <span fg="#FCA5A5">{state.message}</span>
            </text>
          </box>
        </box>
      ) : (
        <box flexDirection="row" width="100%" flexGrow={1}>
          <box marginRight={1}>
            <Logo />
          </box>
          <box flexDirection="column" width={56}>
            <box border padding={1} flexDirection="column">
              <box flexDirection="row" justifyContent="space-between" width="100%">
                <text>
                  <strong>Checking Balance</strong>
                </text>
                <text>
                  <span fg="#6B7280">h to hide</span>
                </text>
              </box>
              <box marginTop={1}>{body}</box>
            </box>
            <box border padding={1} marginTop={1} flexDirection="column">
              <box flexDirection="row" justifyContent="space-between" width="100%">
                <text>
                  <strong>Latest Transactions</strong>
                </text>
                <text>
                  <span fg="#6B7280">
                    {state.status === "loading"
                      ? ""
                      : `t to hide  Page ${state.transactionsPage}/${state.transactionsTotalPages}`}
                  </span>
                </text>
              </box>
              <box marginTop={1}>
                {state.status === "loading" ? (
                  <text>
                    <span fg="#93C5FD">Loading transactions...</span>
                  </text>
                ) : state.transactionsLoading ? (
                  <text>
                    <span fg="#93C5FD">Loading transactions page...</span>
                  </text>
                ) : state.transactionsError ? (
                  <text>
                    <span fg="#FCA5A5">{state.transactionsError}</span>
                  </text>
                ) : (
                  <TransactionsList transactions={state.transactions} hidden={hideTransactions} />
                )}
              </box>
            </box>
          </box>
        </box>
      )}
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">
            {apiKey === null
              ? ""
              : "Use left/right to change transactions page. Press q or esc to exit"}
          </span>
        </text>
      </box>
    </box>
  )
}

function getPrintableText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "")
}

function isThrottleWindowElapsed(
  lastTriggeredAtRef: { current: number },
  throttleMs: number,
): boolean {
  const now = Date.now()
  if (now - lastTriggeredAtRef.current < throttleMs) {
    return false
  }

  lastTriggeredAtRef.current = now
  return true
}
