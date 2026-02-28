import { useEffect, useMemo, useRef, useState } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import {
  getAccountDetails,
  getAsset,
  getAssets,
  getCheckingBalance,
  getLatestTransactions,
  getStocksBalance,
  getWallets,
  WallbitRequestError,
} from "./api/wallbit"
import type {
  AccountDetails,
  Asset,
  CheckingBalance,
  CryptoWallet,
  StockBalance,
  Transaction,
} from "./types/wallbit"
import { AssetsTable } from "./ui/assets-table"
import { BalanceList } from "./ui/balance-list"
import { Logo } from "./ui/logo"
import { StocksList } from "./ui/stocks-list"
import { TransactionsList } from "./ui/transactions-list"
import { WalletsList } from "./ui/wallets-list"

type AppState =
  | { status: "loading" }
  | {
      status: "success"
      accountDetails: AccountDetails | null
      balances: CheckingBalance[]
      wallets: CryptoWallet[]
      stocks: StockBalance[]
      transactions: Transaction[]
      transactionsPage: number
      transactionsTotalPages: number
      transactionsLoading: boolean
      transactionsError: string | null
    }
  | { status: "error"; message: string }

const PAGINATION_THROTTLE_MS = 300

type AssetsModalState = {
  open: boolean
  loading: boolean
  error: string | null
  assets: Asset[]
  selectedIndex: number
  page: number
  totalPages: number
  searchMode: boolean
  searchInput: string
  searchApplied: string
  previewOpen: boolean
  previewLoading: boolean
  previewError: string | null
  previewAsset: Asset | null
}

export function App() {
  const renderer = useRenderer()
  const [state, setState] = useState<AppState>({ status: "loading" })
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [hideValues, setHideValues] = useState(false)
  const lastPaginationKeyAtRef = useRef(0)
  const [assetsModal, setAssetsModal] = useState<AssetsModalState>({
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
  })

  useKeyboard((key) => {
    const keyName = key.name.toLowerCase()
    const shouldExit = key.name === "q" || (key.ctrl && key.name === "c")

    if (shouldExit) {
      renderer.destroy()
      return
    }

    if (isHelpShortcut(key)) {
      setHelpModalOpen((current) => !current)
      return
    }

    if (key.name === "escape" && helpModalOpen) {
      setHelpModalOpen(false)
      return
    }

    if (key.name === "escape" && assetsModal.open) {
      if (assetsModal.previewOpen) {
        setAssetsModal((current) => ({
          ...current,
          previewOpen: false,
          previewError: null,
          previewLoading: false,
        }))
      } else {
        setAssetsModal((current) => ({ ...current, open: false, searchMode: false }))
      }
      return
    }

    if (key.name === "escape") {
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
      setHideValues((current) => !current)
      return
    }

    if (keyName === "t" && state.status === "success" && !assetsModal.open) {
      setAssetsModal((current) => ({
        ...current,
        open: true,
        searchMode: false,
        previewOpen: false,
        previewError: null,
        previewLoading: false,
      }))

      if (assetsModal.assets.length === 0 && !assetsModal.loading) {
        void loadAssetsPage(1, assetsModal.searchApplied)
      }
      return
    }

    if (assetsModal.open && !assetsModal.previewOpen && state.status === "success") {
      const isSlashKey = key.sequence === "/" || key.name === "slash" || key.name === "/"

      if (isSlashKey && !assetsModal.searchMode) {
        setAssetsModal((current) => ({
          ...current,
          searchMode: true,
          searchInput: current.searchApplied,
        }))
        return
      }

      if (assetsModal.searchMode) {
        if (key.name === "escape") {
          setAssetsModal((current) => ({
            ...current,
            searchMode: false,
            searchInput: current.searchApplied,
          }))
          return
        }

        if (key.name === "enter" || key.name === "return") {
          const query = assetsModal.searchInput.trim()
          setAssetsModal((current) => ({
            ...current,
            searchMode: false,
            searchApplied: query,
          }))
          void loadAssetsPage(1, query)
          return
        }

        if (key.name === "backspace" || key.name === "delete") {
          setAssetsModal((current) => ({
            ...current,
            searchInput: current.searchInput.slice(0, -1),
          }))
          return
        }

        if (!key.ctrl && !key.meta && !key.option) {
          const typedText = getPrintableText(key.sequence)
          if (typedText.length > 0) {
            setAssetsModal((current) => ({
              ...current,
              searchInput: current.searchInput + typedText,
            }))
            return
          }
        }

        return
      }
    }

    if (assetsModal.open && !assetsModal.previewOpen && state.status === "success" && keyName === "down") {
      setAssetsModal((current) => ({
        ...current,
        selectedIndex: Math.min(current.selectedIndex + 1, Math.max(0, current.assets.length - 1)),
      }))
      return
    }

    if (assetsModal.open && !assetsModal.previewOpen && state.status === "success" && keyName === "up") {
      setAssetsModal((current) => ({
        ...current,
        selectedIndex: Math.max(0, current.selectedIndex - 1),
      }))
      return
    }

    if (
      assetsModal.open &&
      !assetsModal.previewOpen &&
      state.status === "success" &&
      (keyName === "enter" || keyName === "return")
    ) {
      const selectedAsset = assetsModal.assets[assetsModal.selectedIndex]
      if (!selectedAsset) {
        return
      }

      void openAssetPreview(selectedAsset.symbol)
      return
    }

    if (assetsModal.open && !assetsModal.previewOpen && state.status === "success" && keyName === "right") {
      if (!isThrottleWindowElapsed(lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (assetsModal.loading || assetsModal.page >= assetsModal.totalPages) {
        return
      }

      void loadAssetsPage(assetsModal.page + 1, assetsModal.searchApplied)
      return
    }

    if (assetsModal.open && !assetsModal.previewOpen && state.status === "success" && keyName === "left") {
      if (!isThrottleWindowElapsed(lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (assetsModal.loading || assetsModal.page <= 1) {
        return
      }

      void loadAssetsPage(assetsModal.page - 1, assetsModal.searchApplied)
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
        const [accountDetails, balances, wallets, stocks, transactionsPage] = await Promise.all([
          getAccountDetails(activeApiKey),
          getCheckingBalance(activeApiKey),
          getWallets(activeApiKey),
          getStocksBalance(activeApiKey),
          getLatestTransactions(activeApiKey, 1, 10),
        ])

        if (!mounted) {
          return
        }

        setState({
          status: "success",
          accountDetails,
          balances,
          wallets,
          stocks,
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

  async function loadAssetsPage(page: number, searchQuery: string): Promise<void> {
    if (apiKey === null) {
      return
    }

    const activeApiKey = apiKey
    setAssetsModal((current) => ({
      ...current,
      loading: true,
      error: null,
      open: true,
    }))

    try {
      const nextPage = await getAssets(activeApiKey, page, 10, searchQuery)

      setAssetsModal((current) => ({
        ...current,
        loading: false,
        error: null,
        assets: nextPage.data,
        selectedIndex: 0,
        page: nextPage.currentPage,
        totalPages: nextPage.pages,
        searchApplied: searchQuery,
        previewOpen: false,
        previewLoading: false,
        previewError: null,
        previewAsset: null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load assets."
      setAssetsModal((current) => ({
        ...current,
        loading: false,
        error: message,
      }))
    }
  }

  async function openAssetPreview(symbol: string): Promise<void> {
    if (apiKey === null) {
      return
    }

    const activeApiKey = apiKey
    setAssetsModal((current) => ({
      ...current,
      previewOpen: true,
      previewLoading: true,
      previewError: null,
      previewAsset: null,
    }))

    try {
      const asset = await getAsset(activeApiKey, symbol)
      setAssetsModal((current) => ({
        ...current,
        previewOpen: true,
        previewLoading: false,
        previewError: null,
        previewAsset: asset,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load asset preview."
      setAssetsModal((current) => ({
        ...current,
        previewOpen: true,
        previewLoading: false,
        previewError: message,
      }))
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

    return <BalanceList balances={state.balances} hidden={hideValues} />
  }, [hideValues, state])

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
      ) : helpModalOpen ? (
        <box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
          <box border width="78%" height="74%" padding={1} flexDirection="column">
            <text>
              <strong>CLI Help</strong>
            </text>
            <box marginTop={1}>
              <text>
                <span fg="#93C5FD">Global</span>
                <br />
                <span fg="#D1D5DB">?           Toggle this help modal</span>
                <br />
                <span fg="#D1D5DB">q / ctrl+c  Exit the CLI</span>
                <br />
                <span fg="#D1D5DB">esc         Close overlays or exit</span>
                <br />
                <br />
                <span fg="#93C5FD">Dashboard</span>
                <br />
                <span fg="#D1D5DB">h           Hide/show all currency values</span>
                <br />
                <span fg="#D1D5DB">left/right  Previous/next transactions page</span>
                <br />
                <span fg="#D1D5DB">t           Open assets modal</span>
                <br />
                <br />
                <span fg="#93C5FD">Assets Modal</span>
                <br />
                <span fg="#D1D5DB">/           Search by asset symbol or name</span>
                <br />
                <span fg="#D1D5DB">up/down     Move selected asset row</span>
                <br />
                <span fg="#D1D5DB">enter       Open selected asset preview</span>
                <br />
                <span fg="#D1D5DB">left/right  Previous/next assets page</span>
              </text>
            </box>
          </box>
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
      ) : assetsModal.open && state.status === "success" ? (
        <box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
          <box border width="92%" height="88%" padding={1} flexDirection="column">
            <box flexDirection="row" justifyContent="space-between" width="100%">
              <text>
                <strong>Available Assets</strong>
              </text>
              <text>
                <span fg="#6B7280">Page {assetsModal.page}/{assetsModal.totalPages}</span>
              </text>
            </box>
            <box marginTop={1}>
              <text>
                <span fg="#6B7280">
                  {assetsModal.searchMode
                    ? `/${assetsModal.searchInput}|`
                    : assetsModal.searchApplied.length > 0
                      ? `Filter: ${assetsModal.searchApplied}`
                      : "Press / to search by symbol or name"}
                </span>
              </text>
            </box>
            <box marginTop={1} flexGrow={1}>
              {assetsModal.loading ? (
                <text>
                  <span fg="#93C5FD">Loading assets...</span>
                </text>
              ) : assetsModal.error ? (
                <text>
                  <span fg="#FCA5A5">{assetsModal.error}</span>
                </text>
              ) : assetsModal.previewOpen ? (
                <box border padding={1} width="100%" height="100%" flexDirection="column">
                  <text>
                    <strong>{assetsModal.previewAsset?.symbol ?? "Asset"}</strong>
                  </text>
                  <box marginTop={1}>
                    {assetsModal.previewLoading ? (
                      <text>
                        <span fg="#93C5FD">Loading asset preview...</span>
                      </text>
                    ) : assetsModal.previewError ? (
                      <text>
                        <span fg="#FCA5A5">{assetsModal.previewError}</span>
                      </text>
                    ) : (
                      <text>
                        <span fg="#D1D5DB">Name: {assetsModal.previewAsset?.name ?? "-"}</span>
                        <br />
                        <span fg="#D1D5DB">Price: {formatAssetPrice(assetsModal.previewAsset?.price)}</span>
                        <br />
                        <span fg="#9CA3AF">Type: {assetsModal.previewAsset?.asset_type ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">Exchange: {assetsModal.previewAsset?.exchange ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">Sector: {assetsModal.previewAsset?.sector ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">Country: {assetsModal.previewAsset?.country ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">CEO: {assetsModal.previewAsset?.ceo ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">Employees: {assetsModal.previewAsset?.employees ?? "-"}</span>
                        <br />
                        <span fg="#9CA3AF">
                          Market Cap (M): {assetsModal.previewAsset?.market_cap_m ?? "-"}
                        </span>
                        <br />
                        <span fg="#D1D5DB">
                          Description: {clipText(assetsModal.previewAsset?.description ?? "-", 360)}
                        </span>
                      </text>
                    )}
                  </box>
                </box>
              ) : (
                <AssetsTable assets={assetsModal.assets} selectedIndex={assetsModal.selectedIndex} />
              )}
            </box>
          </box>
        </box>
      ) : (
        <box flexDirection="row" width="100%" flexGrow={1}>
          <box marginRight={1} flexDirection="column" alignItems="center">
            <Logo />
            <box marginTop={1}>
              <text>
                <span fg="#9CA3AF">
                  {state.status === "success"
                    ? getUserSummary(state.accountDetails)
                    : ""}
                </span>
              </text>
            </box>
          </box>
          <box flexDirection="column" width={56}>
            <box border padding={1} flexDirection="column">
              <box flexDirection="row" justifyContent="space-between" width="100%">
                <text>
                  <strong>Checking Balance</strong>
                </text>
                <text>
                  <span fg="#6B7280">h to hide all</span>
                </text>
              </box>
              <box marginTop={1}>{body}</box>
            </box>
            <box border padding={1} marginTop={1} flexDirection="column">
              <box flexDirection="row" justifyContent="space-between" width="100%">
                <text>
                  <strong>Crypto Wallets</strong>
                </text>
              </box>
              <box marginTop={1}>
                {state.status === "loading" ? (
                  <text>
                    <span fg="#93C5FD">Loading wallets...</span>
                  </text>
                ) : (
                  <WalletsList wallets={state.wallets} />
                )}
              </box>
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
                      : `h to hide  Page ${state.transactionsPage}/${state.transactionsTotalPages}`}
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
                  <TransactionsList transactions={state.transactions} hidden={hideValues} />
                )}
              </box>
            </box>
          </box>
          <box border padding={1} marginLeft={1} flexDirection="column" width={28}>
            <text>
              <strong>Stocks Portfolio</strong>
            </text>
            <box marginTop={1} flexGrow={1}>
              {state.status === "loading" ? (
                <text>
                  <span fg="#93C5FD">Loading portfolio...</span>
                </text>
              ) : (
                <StocksList stocks={state.stocks} />
              )}
            </box>
          </box>
        </box>
      )}
      <box marginTop={1}>
        <text>
          <span fg="#6B7280">Press ? for help</span>
        </text>
      </box>
    </box>
  )
}

function isHelpShortcut(key: { name: string; shift: boolean; sequence: string }): boolean {
  return key.sequence === "?" || (key.name === "slash" && key.shift)
}

function getPrintableText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "")
}

function formatAssetPrice(value: number | string | undefined): string {
  if (typeof value === "undefined") {
    return "-"
  }

  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return "-"
  }

  return `$${numeric.toFixed(2)}`
}

function clipText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength)
  }

  return `${value.slice(0, maxLength - 3)}...`
}

function getUserSummary(accountDetails: AccountDetails | null): string {
  if (accountDetails === null) {
    return ""
  }

  const holderName = accountDetails.holder_name?.trim() || "-"
  return `${holderName}`
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
