import { useCallback, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  getAccountDetails,
  getAsset,
  getAssets,
  getCheckingBalance,
  getLatestTransactions,
  getStocksBalance,
  getWallets,
  WallbitRequestError,
} from "../../api/wallbit"
import { ASSETS_PER_PAGE, TRANSACTIONS_PER_PAGE } from "../constants"
import type { AppState, AssetsModalState } from "../types"

type SetAppState = Dispatch<SetStateAction<AppState>>
type SetAssetsModalState = Dispatch<SetStateAction<AssetsModalState>>

type UseAppActionsParams = {
  apiKey: string | null
  setState: SetAppState
  setAssetsModal: SetAssetsModalState
  onAuthenticationError: (message: string) => void
}

function isAuthenticationError(error: WallbitRequestError): boolean {
  return error.status === 401 || error.status === 403
}

export function useAppActions(params: UseAppActionsParams) {
  const apiKey = params.apiKey
  const setState = params.setState
  const setAssetsModal = params.setAssetsModal
  const onAuthenticationError = params.onAuthenticationError

  useEffect(() => {
    if (apiKey === null) {
      return
    }

    const activeApiKey = apiKey
    let mounted = true

    async function loadDashboard() {
      setState({ status: "loading" })

      try {
        const [accountDetails, balances, wallets, stocks, transactionsPage] = await Promise.all([
          getAccountDetails(activeApiKey),
          getCheckingBalance(activeApiKey),
          getWallets(activeApiKey),
          getStocksBalance(activeApiKey),
          getLatestTransactions(activeApiKey, 1, TRANSACTIONS_PER_PAGE),
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
          if (isAuthenticationError(error)) {
            onAuthenticationError(error.message)
            return
          }

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
  }, [apiKey, onAuthenticationError, setState])

  const loadTransactionsPage = useCallback(
    async (page: number): Promise<void> => {
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
        const nextPage = await getLatestTransactions(activeApiKey, page, TRANSACTIONS_PER_PAGE)

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
        if (error instanceof WallbitRequestError && isAuthenticationError(error)) {
          onAuthenticationError(error.message)
          return
        }

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
    },
    [apiKey, onAuthenticationError, setState],
  )

  const loadAssetsPage = useCallback(
    async (page: number, searchQuery: string): Promise<void> => {
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
        const nextPage = await getAssets(activeApiKey, page, ASSETS_PER_PAGE, searchQuery)

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
        if (error instanceof WallbitRequestError && isAuthenticationError(error)) {
          onAuthenticationError(error.message)
          return
        }

        const message = error instanceof Error ? error.message : "Failed to load assets."
        setAssetsModal((current) => ({
          ...current,
          loading: false,
          error: message,
        }))
      }
    },
    [apiKey, onAuthenticationError, setAssetsModal],
  )

  const openAssetPreview = useCallback(
    async (symbol: string): Promise<void> => {
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
        if (error instanceof WallbitRequestError && isAuthenticationError(error)) {
          onAuthenticationError(error.message)
          return
        }

        const message = error instanceof Error ? error.message : "Failed to load asset preview."
        setAssetsModal((current) => ({
          ...current,
          previewOpen: true,
          previewLoading: false,
          previewError: message,
        }))
      }
    },
    [apiKey, onAuthenticationError, setAssetsModal],
  )

  return {
    loadTransactionsPage,
    loadAssetsPage,
    openAssetPreview,
  }
}
