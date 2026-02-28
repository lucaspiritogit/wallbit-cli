import { useCallback, useMemo, useRef, useState } from "react"
import { useRenderer, useTerminalDimensions } from "@opentui/react"
import { BalanceList } from "./ui/balance-list"
import { Logo } from "./ui/logo"
import { WalletsModal } from "./ui/wallets-modal"
import { sortWallets } from "./utils/wallets"
import { useApiKeyPaste } from "./app/hooks/use-api-key-paste"
import { useAppActions } from "./app/hooks/use-app-actions"
import { useAppKeyboard } from "./app/hooks/use-app-keyboard"
import { useWalletsStatusToast } from "./app/hooks/use-wallets-status-toast"
import {
  COMPACT_MIN_HEIGHT,
  COMPACT_MIN_WIDTH,
  DASHBOARD_HIDE_LOGO_WIDTH,
} from "./app/constants"
import { getWalletRowsPerPage } from "./app/helpers"
import { AssetsModal } from "./app/views/assets-modal"
import { AuthScreen } from "./app/views/auth-screen"
import { DashboardCompact } from "./app/views/dashboard-compact"
import { DashboardFull } from "./app/views/dashboard-full"
import { DashboardLoading } from "./app/views/dashboard-loading"
import { HelpModal } from "./app/views/help-modal"
import type { AppState, AssetsModalState, WalletsModalState } from "./app/types"

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
  scrollOffset: 0,
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
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [hideValues, setHideValues] = useState(false)
  const [assetsModal, setAssetsModal] = useState<AssetsModalState>(INITIAL_ASSETS_MODAL_STATE)
  const [walletsModal, setWalletsModal] = useState<WalletsModalState>(INITIAL_WALLETS_MODAL_STATE)
  const lastPaginationKeyAtRef = useRef(0)

  const sortedWallets = useMemo(() => {
    if (state.status !== "success") {
      return []
    }

    return sortWallets(state.wallets)
  }, [state])

  const walletRowsPerPage = useMemo(() => getWalletRowsPerPage(terminalDimensions.height), [terminalDimensions.height])

  const handleAuthenticationError = useCallback((message: string) => {
    setApiKey(null)
    setAuthError(message)
    setState({ status: "loading" })
  }, [])

  const appActions = useAppActions({
    apiKey,
    setState,
    setAssetsModal,
    onAuthenticationError: handleAuthenticationError,
  })

  useWalletsStatusToast({
    walletsModal,
    setWalletsModal,
  })

  useApiKeyPaste({
    apiKey,
    renderer,
    setApiKeyInput,
    setAuthError,
  })

  useAppKeyboard({
    renderer,
    apiKey,
    apiKeyInput,
    setApiKey,
    setApiKeyInput,
    setAuthError,
    helpModalOpen,
    setHelpModalOpen,
    hideValues,
    setHideValues,
    state,
    assetsModal,
    setAssetsModal,
    walletsModal,
    setWalletsModal,
    sortedWallets,
    walletRowsPerPage,
    lastPaginationKeyAtRef,
    loadTransactionsPage: appActions.loadTransactionsPage,
    loadAssetsPage: appActions.loadAssetsPage,
    openAssetPreview: appActions.openAssetPreview,
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

    return <BalanceList balances={state.balances} hidden={hideValues} />
  }, [hideValues, state])

  const shouldUseCompactLayout =
    terminalDimensions.height < COMPACT_MIN_HEIGHT || terminalDimensions.width < COMPACT_MIN_WIDTH
  const shouldShowLogo = terminalDimensions.width >= DASHBOARD_HIDE_LOGO_WIDTH

  return (
    <box flexDirection="column" width="100%" height="100%" padding={1}>
      {apiKey === null ? (
        <box flexDirection="column" alignItems="center" width="100%" height="100%">
          <Logo />
          <AuthScreen apiKeyInput={apiKeyInput} authError={authError} />
        </box>
      ) : helpModalOpen ? (
        <HelpModal />
      ) : state.status === "loading" ? (
        <DashboardLoading />
      ) : state.status === "error" ? (
        <box flexDirection="column">
          <Logo />
          <box marginTop={1}>
            <text>
              <span fg="#FCA5A5">{state.message}</span>
            </text>
          </box>
        </box>
      ) : assetsModal.open && state.status === "success" ? (
        <AssetsModal assetsModal={assetsModal} />
      ) : walletsModal.open && state.status === "success" ? (
        <WalletsModal
          wallets={state.wallets}
          selectedIndex={walletsModal.selectedIndex}
          scrollOffset={walletsModal.scrollOffset}
          visibleRows={walletRowsPerPage}
          statusType={walletsModal.status.type}
          statusMessage={walletsModal.status.message}
        />
      ) : shouldUseCompactLayout ? (
        <DashboardCompact body={body} />
      ) : (
        <DashboardFull
          body={body}
          state={state}
          hideValues={hideValues}
          showLogo={shouldShowLogo}
        />
      )}
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">Press ? for help</span>
        </text>
      </box>
    </box>
  )
}
