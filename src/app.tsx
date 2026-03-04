import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRenderer, useTerminalDimensions } from "@opentui/react"
import { BalanceList } from "./ui/balance-list"
import { CommandBar } from "./ui/command-bar"
import { Logo } from "./ui/logo"
import type { AgentChatMessage } from "./ui/agent-chat-panel"
import { WalletsModal } from "./ui/wallets-modal"
import { runWallbitChat } from "./agent/chat-agent"
import { sortWallets } from "./utils/wallets"
import { useAppActions } from "./app/hooks/use-app-actions"
import { useAppKeyboard } from "./app/hooks/use-app-keyboard"
import { useWalletsStatusToast } from "./app/hooks/use-wallets-status-toast"
import {
  COMPACT_MIN_HEIGHT,
  COMPACT_MIN_WIDTH,
  DASHBOARD_HIDE_LOGO_WIDTH,
} from "./app/constants"
import { AssetsModal } from "./app/views/assets-modal"
import { AuthScreen } from "./app/views/auth-screen"
import { DashboardCompact } from "./app/views/dashboard-compact"
import { DashboardFull } from "./app/views/dashboard-full"
import { DashboardLoading } from "./app/views/dashboard-loading"
import { HelpModal } from "./app/views/help-modal"
import { getStoredAiProvider, getStoredOpenAiApiKey, setStoredAiProvider, setStoredOpenAiApiKey } from "./app/keychain"
import type { AppState, AssetsModalState, WalletsModalState } from "./app/types"

type AiProvider = "openai" | "none"

const INITIAL_ASSETS_MODAL_STATE: AssetsModalState = {
  open: false,
  loading: false,
  error: null,
  assets: [],
  selectedIndex: 0,
  page: 1,
  totalPages: 1,
  searchMode: false,
  searchInput: "",
  searchApplied: "",
  previewOpen: false,
  previewLoading: false,
  previewError: null,
  previewAsset: null,
}

const INITIAL_WALLETS_MODAL_STATE: WalletsModalState = {
  open: false,
  selectedIndex: 0,
  status: {
    type: "idle",
    message: "",
  },
}

export function App() {
  const renderer = useRenderer()
  const terminalDimensions = useTerminalDimensions()
  const [state, setState] = useState<AppState>({ status: "loading" })
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState<AiProvider | null>(null)
  const [openAiApiKey, setOpenAiApiKey] = useState<string | null>(() => {
    const envValue = process.env.OPENAI_API_KEY?.trim()
    return envValue && envValue.length > 0 ? envValue : null
  })
  const [openAiKeyLoaded, setOpenAiKeyLoaded] = useState<boolean>(() => {
    const envValue = process.env.OPENAI_API_KEY?.trim()
    return Boolean(envValue && envValue.length > 0)
  })
  const [openAiKeyPromptOpen, setOpenAiKeyPromptOpen] = useState(false)
  const [aiProviderSelectionIndex, setAiProviderSelectionIndex] = useState(0)
  const [authInput, setAuthInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [hideValues, setHideValues] = useState(false)
  const [assetsModal, setAssetsModal] = useState<AssetsModalState>(INITIAL_ASSETS_MODAL_STATE)
  const [walletsModal, setWalletsModal] = useState<WalletsModalState>(INITIAL_WALLETS_MODAL_STATE)
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatScrollOffset, setChatScrollOffset] = useState(0)
  const [commandInput, setCommandInput] = useState("")
  const [commandBarFocused, setCommandBarFocused] = useState(false)
  const [commandStatusMessage, setCommandStatusMessage] = useState<string | null>(null)
  const [commandStatusType, setCommandStatusType] = useState<"info" | "error" | "success">("info")
  const lastPaginationKeyAtRef = useRef(0)

  const sortedWallets = useMemo(() => {
    if (state.status !== "success") {
      return []
    }

    return sortWallets(state.wallets)
  }, [state])

  const chatVisibleRows = useMemo(() => Math.max(8, terminalDimensions.height - 15), [terminalDimensions.height])
  const authMode = useMemo<"wallbit" | "ai-provider" | "openai-key" | null>(() => {
    if (apiKey === null) {
      return "wallbit"
    }

    if (aiProvider === null) {
      if (openAiKeyPromptOpen) {
        return "openai-key"
      }

      return "ai-provider"
    }

    return null
  }, [apiKey, aiProvider, openAiKeyPromptOpen])

  useEffect(() => {
    if (openAiApiKey !== null) {
      return
    }

    let mounted = true

    async function loadKeyFromKeychain() {
      try {
        const key = await getStoredOpenAiApiKey()
        if (!mounted || key === null) {
          if (mounted) {
            setOpenAiKeyLoaded(true)
          }
          return
        }

        setOpenAiApiKey(key)
        setOpenAiKeyLoaded(true)
      } catch {
        if (mounted) {
          setOpenAiKeyLoaded(true)
        }
      }
    }

    void loadKeyFromKeychain()

    return () => {
      mounted = false
    }
  }, [openAiApiKey])

  useEffect(() => {
    if (aiProvider !== null) {
      return
    }

    let mounted = true

    async function loadAiProviderFromKeychain() {
      try {
        const storedProvider = await getStoredAiProvider()
        if (!mounted || storedProvider === null) {
          return
        }

        setAiProvider(storedProvider)
        setAiProviderSelectionIndex(storedProvider === "none" ? 0 : 1)
      } catch {
      }
    }

    void loadAiProviderFromKeychain()

    return () => {
      mounted = false
    }
  }, [aiProvider])

  const submitAuthInput = useCallback(async (): Promise<void> => {
    const enteredValue = authInput.trim()
    if (enteredValue.length === 0) {
      setAuthError("API key is required.")
      return
    }

    if (authMode === "wallbit") {
      setAuthError(null)
      setApiKey(enteredValue)
      setAuthInput("")
      return
    }

    if (authMode === "openai-key") {
      try {
        await setStoredOpenAiApiKey(enteredValue)
        await setStoredAiProvider("openai")
        setOpenAiApiKey(enteredValue)
        setOpenAiKeyLoaded(true)
        setAiProvider("openai")
        setOpenAiKeyPromptOpen(false)
        setAuthInput("")
        setAuthError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to store OpenAI API key."
        setAuthError(message)
      }
    }
  }, [authInput, authMode])

  const submitAiProviderSelection = useCallback(async (): Promise<void> => {
    try {
      if (aiProviderSelectionIndex === 1) {
        if (!openAiKeyLoaded) {
          setAuthError("Checking keychain for OpenAI key. Try again in a second.")
          return
        }

        if (openAiApiKey === null) {
          setOpenAiKeyPromptOpen(true)
          setAuthInput("")
          setAuthError("OpenAI key required. Paste it and press enter to save.")
          return
        }

        setOpenAiKeyPromptOpen(false)
        setAuthError(null)
        await setStoredAiProvider("openai")
        setAiProvider("openai")
        return
      }

      setOpenAiKeyPromptOpen(false)
      setAuthError(null)
      await setStoredAiProvider("none")
      setAiProvider("none")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to store AI provider preference."
      setAuthError(message)
    }
  }, [aiProviderSelectionIndex, openAiApiKey, openAiKeyLoaded])

  const handleAiProviderChange = useCallback((index: number) => {
    setOpenAiKeyPromptOpen(false)
    setAuthInput("")
    setAiProviderSelectionIndex(index)
    setAuthError(null)
  }, [])

  const handleAiProviderSubmit = useCallback(() => {
    void submitAiProviderSelection()
  }, [submitAiProviderSelection])

  const handleAuthenticationError = useCallback((message: string) => {
    setApiKey(null)
    setAiProvider(null)
    setAuthError(message)
    setState({ status: "loading" })
  }, [])

  const appendChatMessage = useCallback((role: AgentChatMessage["role"], content: string, toolsUsed?: string[]) => {
    const cleanContent = content.trim()
    if (!cleanContent) {
      return
    }

    setChatMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role,
        content: cleanContent,
        toolsUsed,
      },
    ])
    setChatScrollOffset(0)
  }, [])

  const getChatContext = useCallback((): string => {
    if (state.status !== "success") {
      return "Dashboard data is loading."
    }

    const holderName = state.accountDetails?.holder_name?.trim() || "Unknown holder"
    const checkingCount = state.balances.length
    const walletsCount = state.wallets.length
    const stocksCount = state.stocks.length
    const transactionsCount = state.transactions.length

    return [
      `holder_name=${holderName}`,
      `checking_balances=${checkingCount}`,
      `wallets=${walletsCount}`,
      `stocks=${stocksCount}`,
      `transactions_in_view=${transactionsCount}`,
    ].join(", ")
  }, [state])

  const sendChatMessage = useCallback(async (value: string): Promise<void> => {
    const enteredMessage = value.trim()
    if (!enteredMessage || chatLoading) {
      return
    }

    setChatError(null)
    appendChatMessage("user", enteredMessage)
    setChatLoading(true)

    try {
      const response = await runWallbitChat({
        prompt: enteredMessage,
        context: getChatContext(),
        wallbitApiKey: apiKey,
        openAiApiKey,
      })
      appendChatMessage("assistant", response.output, response.toolsUsed)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message to agent."
      setChatError(message)
    } finally {
      setChatLoading(false)
    }
  }, [apiKey, appendChatMessage, chatLoading, getChatContext, openAiApiKey])

  const handleCommandSubmit = useCallback(
    (value: string) => {
      const isAiEnabled = aiProvider === "openai" && openAiApiKey !== null
      const enteredValue = value.trim()
      if (enteredValue.length === 0) {
        return
      }

      setCommandInput("")
      setCommandStatusType("info")
      setCommandStatusMessage(null)

      if (enteredValue.startsWith("?")) {
        const prompt = enteredValue.slice(1).trim()
        if (prompt.length === 0) {
          setCommandStatusType("error")
          setCommandStatusMessage("Add a question after ?. Example: ?why is BTC down")
          return
        }

        if (!isAiEnabled) {
          setCommandStatusType("error")
          setCommandStatusMessage("Agent is disabled. Enable OpenAI in auth settings.")
          return
        }

        setChatOpen(true)
        void sendChatMessage(prompt)
        return
      }

      if (enteredValue.startsWith("!")) {
        const actionText = enteredValue.slice(1).trim()
        if (actionText.length === 0) {
          setCommandStatusType("error")
          setCommandStatusMessage("Add an action after !. Example: !buy BTC 200")
          return
        }

        if (actionText.toLowerCase() === "help") {
          setHelpModalOpen(true)
          setCommandStatusType("info")
          setCommandStatusMessage("Opened help.")
          return
        }

        setCommandStatusType("success")
        setCommandStatusMessage(`Queued action: ${actionText}`)
        appendChatMessage("system", `action queued: ${actionText}`)
        return
      }

      setCommandStatusType("error")
      setCommandStatusMessage("Commands must start with ? (agent) or ! (action).")
    },
    [aiProvider, appendChatMessage, openAiApiKey, sendChatMessage],
  )

  const handleAssetsSearchInputChange = useCallback((value: string) => {
    setAssetsModal((current) => ({
      ...current,
      searchInput: value,
    }))
  }, [])

  const appActions = useAppActions({
    apiKey,
    setState,
    setAssetsModal,
    onAuthenticationError: handleAuthenticationError,
  })

  const handleAssetsSearchSubmit = useCallback(
    (value: string) => {
      const query = value.trim()
      setAssetsModal((current) => ({
        ...current,
        searchMode: false,
        searchInput: query,
        searchApplied: query,
      }))
      void appActions.loadAssetsPage(1, query)
    },
    [appActions],
  )

  const handleWalletSelectionChange = useCallback((index: number) => {
    setWalletsModal((current) => ({
      ...current,
      selectedIndex: index,
      status: {
        type: "idle",
        message: "",
      },
    }))
  }, [])

  const handleWalletCopy = useCallback(
    (index: number) => {
      const selectedWallet = sortedWallets[index]
      if (!selectedWallet) {
        return
      }

      const copied = renderer.copyToClipboardOSC52(selectedWallet.address)
      if (copied) {
        setWalletsModal((current) => ({
          ...current,
          selectedIndex: index,
          status: {
            type: "success",
            message: `Copied ${selectedWallet.currency_code} ${selectedWallet.network} address`,
          },
        }))
        return
      }

      setWalletsModal((current) => ({
        ...current,
        selectedIndex: index,
        status: {
          type: "error",
          message: `Clipboard unsupported in this terminal. Copy manually: ${selectedWallet.address}`,
        },
      }))
    },
    [renderer, sortedWallets],
  )

  useWalletsStatusToast({
    walletsModal,
    setWalletsModal,
  })

  const shouldUseCompactLayout =
    terminalDimensions.height < COMPACT_MIN_HEIGHT || terminalDimensions.width < COMPACT_MIN_WIDTH
  const shouldUseMinimalCompactLayout = terminalDimensions.height < COMPACT_MIN_HEIGHT
  const shouldShowLogo = terminalDimensions.width >= DASHBOARD_HIDE_LOGO_WIDTH
  const aiEnabled = aiProvider === "openai" && openAiApiKey !== null
  const chatEnabled = !shouldUseCompactLayout && state.status === "success" && aiEnabled
  const commandBarEnabled = authMode === null && state.status === "success" && !helpModalOpen && !assetsModal.open && !walletsModal.open
  const aiStatusLabel = aiEnabled ? "OpenAI" : "Disabled"

  useAppKeyboard({
    renderer,
    authMode,
    authInput,
    setAuthInput,
    setAuthError,
    submitAuthInput,
    helpModalOpen,
    setHelpModalOpen,
    hideValues,
    setHideValues,
    state,
    assetsModal,
    setAssetsModal,
    walletsModal,
    setWalletsModal,
    copySelectedWallet: handleWalletCopy,
    lastPaginationKeyAtRef,
    loadTransactionsPage: appActions.loadTransactionsPage,
    loadAssetsPage: appActions.loadAssetsPage,
    openAssetPreview: appActions.openAssetPreview,
    chatOpen,
    setChatOpen,
    chatEnabled,
    chatScrollOffset,
    setChatScrollOffset,
    commandBarEnabled,
    commandBarFocused,
    setCommandBarFocused,
  })

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

    return <BalanceList balances={state.balances} hidden={hideValues} accountDetails={state.accountDetails} />
  }, [hideValues, state])

  useEffect(() => {
    if (!chatEnabled && chatOpen) {
      setChatOpen(false)
    }
  }, [chatEnabled, chatOpen])

  useEffect(() => {
    if (!commandBarEnabled && commandBarFocused) {
      setCommandBarFocused(false)
    }
  }, [commandBarEnabled, commandBarFocused])

  const mainContent = useMemo(() => {
    if (authMode !== null) {
      return (
        <box flexDirection="column" alignItems="center" width="100%" height="100%">
          <Logo />
          <AuthScreen
            authInput={authInput}
            authMode={authMode}
            aiProviderSelectionIndex={aiProviderSelectionIndex}
            openAiAvailable={openAiApiKey !== null}
            openAiKeyLoaded={openAiKeyLoaded}
            authError={authError}
            onAiProviderChange={handleAiProviderChange}
            onAiProviderSubmit={handleAiProviderSubmit}
          />
        </box>
      )
    }

    if (helpModalOpen) {
      return <HelpModal />
    }

    if (state.status === "loading") {
      return <DashboardLoading />
    }

    if (state.status === "error") {
      return (
        <box flexDirection="column">
          <Logo />
          <box marginTop={1}>
            <text>
              <span fg="#FCA5A5">{state.message}</span>
            </text>
          </box>
        </box>
      )
    }

    if (assetsModal.open) {
      return (
        <AssetsModal
          assetsModal={assetsModal}
          onSearchInputChange={handleAssetsSearchInputChange}
          onSearchSubmit={handleAssetsSearchSubmit}
        />
      )
    }

    if (walletsModal.open) {
      return (
        <WalletsModal
          wallets={state.wallets}
          selectedIndex={walletsModal.selectedIndex}
          statusType={walletsModal.status.type}
          statusMessage={walletsModal.status.message}
          onSelectionChange={handleWalletSelectionChange}
          onCopySelected={handleWalletCopy}
        />
      )
    }

    if (shouldUseCompactLayout) {
      return (
        <DashboardCompact
          body={body}
          state={state}
          hideValues={hideValues}
          showExtendedContent={!shouldUseMinimalCompactLayout}
          aiStatusLabel={aiStatusLabel}
        />
      )
    }

    return (
      <DashboardFull
        body={body}
        state={state}
        hideValues={hideValues}
        showLogo={shouldShowLogo}
        showAgentChat={chatOpen && aiEnabled}
        aiStatusLabel={aiStatusLabel}
        chatMessages={chatMessages}
        chatLoading={chatLoading}
        chatError={chatError}
        chatVisibleRows={chatVisibleRows}
        chatScrollOffset={chatScrollOffset}
      />
    )
  }, [
    aiProviderSelectionIndex,
    aiStatusLabel,
    assetsModal,
    authError,
    authInput,
    authMode,
    aiEnabled,
    body,
    chatError,
    chatLoading,
    chatMessages,
    chatOpen,
    chatScrollOffset,
    chatVisibleRows,
    handleAiProviderChange,
    handleAiProviderSubmit,
    handleAssetsSearchInputChange,
    handleAssetsSearchSubmit,
    handleWalletCopy,
    handleWalletSelectionChange,
    helpModalOpen,
    hideValues,
    openAiApiKey,
    openAiKeyLoaded,
    shouldShowLogo,
    shouldUseCompactLayout,
    shouldUseMinimalCompactLayout,
    state,
    walletsModal,
  ])

  return (
    <box flexDirection="column" width="100%" height="100%" padding={1}>
      {mainContent}
      {authMode === null && state.status === "success" ? (
        <box marginTop={1}>
          <CommandBar
            value={commandInput}
            onInputChange={setCommandInput}
            onSubmit={handleCommandSubmit}
            focused={commandBarFocused}
            enabled={commandBarEnabled}
            loading={chatLoading}
            statusMessage={commandStatusMessage}
            statusType={commandStatusType}
          />
        </box>
      ) : null}
    </box>
  )
}
