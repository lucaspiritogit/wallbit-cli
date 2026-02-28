import { useKeyboard } from "@opentui/react"
import type { Dispatch, SetStateAction } from "react"
import { PAGINATION_THROTTLE_MS } from "../constants"
import {
  getNextWalletScrollOffset,
  getPrintableText,
  isHelpShortcut,
  isThrottleWindowElapsed,
} from "../helpers"
import type { AppState, AssetsModalState, WalletsModalState } from "../types"
import type { CryptoWallet } from "../../types/wallbit"

type RendererLike = {
  destroy: () => void
  copyToClipboardOSC52: (value: string) => boolean
}

type AppKeyEvent = {
  name: string
  sequence: string
  ctrl: boolean
  meta: boolean
  option: boolean
  shift: boolean
}

type UseAppKeyboardParams = {
  renderer: RendererLike
  apiKey: string | null
  apiKeyInput: string
  setApiKey: Dispatch<SetStateAction<string | null>>
  setApiKeyInput: Dispatch<SetStateAction<string>>
  setAuthError: Dispatch<SetStateAction<string | null>>
  helpModalOpen: boolean
  setHelpModalOpen: Dispatch<SetStateAction<boolean>>
  hideValues: boolean
  setHideValues: Dispatch<SetStateAction<boolean>>
  state: AppState
  assetsModal: AssetsModalState
  setAssetsModal: Dispatch<SetStateAction<AssetsModalState>>
  walletsModal: WalletsModalState
  setWalletsModal: Dispatch<SetStateAction<WalletsModalState>>
  sortedWallets: CryptoWallet[]
  walletRowsPerPage: number
  lastPaginationKeyAtRef: { current: number }
  loadTransactionsPage: (page: number) => Promise<void>
  loadAssetsPage: (page: number, searchQuery: string) => Promise<void>
  openAssetPreview: (symbol: string) => Promise<void>
}

export function useAppKeyboard(params: UseAppKeyboardParams) {
  useKeyboard((key: AppKeyEvent) => {
    const keyName = key.name.toLowerCase()
    const shouldExit = key.name === "q" || (key.ctrl && key.name === "c")

    if (shouldExit) {
      params.renderer.destroy()
      return
    }

    if (isHelpShortcut(key)) {
      params.setHelpModalOpen((current) => !current)
      return
    }

    if (key.name === "escape" && params.helpModalOpen) {
      params.setHelpModalOpen(false)
      return
    }

    if (key.name === "escape" && params.assetsModal.open) {
      if (params.assetsModal.previewOpen) {
        params.setAssetsModal((current) => ({
          ...current,
          previewOpen: false,
          previewError: null,
          previewLoading: false,
        }))
      } else {
        params.setAssetsModal((current) => ({ ...current, open: false, searchMode: false }))
      }
      return
    }

    if (key.name === "escape" && params.walletsModal.open) {
      params.setWalletsModal((current) => ({
        ...current,
        open: false,
        status: {
          type: "idle",
          message: "",
        },
      }))
      return
    }

    if (key.name === "escape") {
      params.renderer.destroy()
      return
    }

    if (params.apiKey === null) {
      if (keyName === "enter" || keyName === "return") {
        const enteredApiKey = params.apiKeyInput.trim()

        if (enteredApiKey.length === 0) {
          params.setAuthError("API key is required.")
          return
        }

        params.setAuthError(null)
        params.setApiKey(enteredApiKey)
        return
      }

      if (keyName === "backspace" || keyName === "delete") {
        params.setApiKeyInput((current) => current.slice(0, -1))
        return
      }

      if (!key.ctrl && !key.meta && !key.option) {
        const typedText = getPrintableText(key.sequence)
        if (typedText.length > 0) {
          params.setApiKeyInput((current) => current + typedText)
          params.setAuthError(null)
          return
        }
      }

      return
    }

    if (params.walletsModal.open && params.state.status === "success") {
      if (keyName === "down") {
        const nextSelectedIndex = Math.min(params.walletsModal.selectedIndex + 1, Math.max(0, params.sortedWallets.length - 1))
        params.setWalletsModal((current) => ({
          ...current,
          selectedIndex: nextSelectedIndex,
          scrollOffset: getNextWalletScrollOffset(nextSelectedIndex, current.scrollOffset, params.walletRowsPerPage),
          status: {
            type: "idle",
            message: "",
          },
        }))
        return
      }

      if (keyName === "up") {
        const nextSelectedIndex = Math.max(0, params.walletsModal.selectedIndex - 1)
        params.setWalletsModal((current) => ({
          ...current,
          selectedIndex: nextSelectedIndex,
          scrollOffset: getNextWalletScrollOffset(nextSelectedIndex, current.scrollOffset, params.walletRowsPerPage),
          status: {
            type: "idle",
            message: "",
          },
        }))
        return
      }

      if (keyName === "c" || keyName === "enter" || keyName === "return") {
        const selectedWallet = params.sortedWallets[params.walletsModal.selectedIndex]
        if (!selectedWallet) {
          return
        }

        const copied = params.renderer.copyToClipboardOSC52(selectedWallet.address)
        if (copied) {
          params.setWalletsModal((current) => ({
            ...current,
            status: {
              type: "success",
              message: `Copied ${selectedWallet.currency_code} ${selectedWallet.network} address`,
            },
          }))
          return
        }

        params.setWalletsModal((current) => ({
          ...current,
          status: {
            type: "error",
            message: `Clipboard unsupported in this terminal. Copy manually: ${selectedWallet.address}`,
          },
        }))
        return
      }

      return
    }

    if (keyName === "h") {
      params.setHideValues((current) => !current)
      return
    }

    if (keyName === "w" && params.state.status === "success" && !params.assetsModal.open && !params.walletsModal.open) {
      params.setWalletsModal({
        open: true,
        selectedIndex: 0,
        scrollOffset: 0,
        status: {
          type: "idle",
          message: "",
        },
      })
      return
    }

    if (keyName === "t" && params.state.status === "success" && !params.assetsModal.open) {
      params.setAssetsModal((current) => ({
        ...current,
        open: true,
        searchMode: false,
        previewOpen: false,
        previewError: null,
        previewLoading: false,
      }))

      if (params.assetsModal.assets.length === 0 && !params.assetsModal.loading) {
        void params.loadAssetsPage(1, params.assetsModal.searchApplied)
      }
      return
    }

    if (params.assetsModal.open && !params.assetsModal.previewOpen && params.state.status === "success") {
      const isSlashKey = key.sequence === "/" || key.name === "slash" || key.name === "/"

      if (isSlashKey && !params.assetsModal.searchMode) {
        params.setAssetsModal((current) => ({
          ...current,
          searchMode: true,
          searchInput: current.searchApplied,
        }))
        return
      }

      if (params.assetsModal.searchMode) {
        if (key.name === "escape") {
          params.setAssetsModal((current) => ({
            ...current,
            searchMode: false,
            searchInput: current.searchApplied,
          }))
          return
        }

        if (key.name === "enter" || key.name === "return") {
          const query = params.assetsModal.searchInput.trim()
          params.setAssetsModal((current) => ({
            ...current,
            searchMode: false,
            searchApplied: query,
          }))
          void params.loadAssetsPage(1, query)
          return
        }

        if (key.name === "backspace" || key.name === "delete") {
          params.setAssetsModal((current) => ({
            ...current,
            searchInput: current.searchInput.slice(0, -1),
          }))
          return
        }

        if (!key.ctrl && !key.meta && !key.option) {
          const typedText = getPrintableText(key.sequence)
          if (typedText.length > 0) {
            params.setAssetsModal((current) => ({
              ...current,
              searchInput: current.searchInput + typedText,
            }))
            return
          }
        }

        return
      }
    }

    if (params.assetsModal.open && !params.assetsModal.previewOpen && params.state.status === "success" && keyName === "down") {
      params.setAssetsModal((current) => ({
        ...current,
        selectedIndex: Math.min(current.selectedIndex + 1, Math.max(0, current.assets.length - 1)),
      }))
      return
    }

    if (params.assetsModal.open && !params.assetsModal.previewOpen && params.state.status === "success" && keyName === "up") {
      params.setAssetsModal((current) => ({
        ...current,
        selectedIndex: Math.max(0, current.selectedIndex - 1),
      }))
      return
    }

    if (
      params.assetsModal.open &&
      !params.assetsModal.previewOpen &&
      params.state.status === "success" &&
      (keyName === "enter" || keyName === "return")
    ) {
      const selectedAsset = params.assetsModal.assets[params.assetsModal.selectedIndex]
      if (!selectedAsset) {
        return
      }

      void params.openAssetPreview(selectedAsset.symbol)
      return
    }

    if (params.assetsModal.open && !params.assetsModal.previewOpen && params.state.status === "success" && keyName === "right") {
      if (!isThrottleWindowElapsed(params.lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (params.assetsModal.loading || params.assetsModal.page >= params.assetsModal.totalPages) {
        return
      }

      void params.loadAssetsPage(params.assetsModal.page + 1, params.assetsModal.searchApplied)
      return
    }

    if (params.assetsModal.open && !params.assetsModal.previewOpen && params.state.status === "success" && keyName === "left") {
      if (!isThrottleWindowElapsed(params.lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (params.assetsModal.loading || params.assetsModal.page <= 1) {
        return
      }

      void params.loadAssetsPage(params.assetsModal.page - 1, params.assetsModal.searchApplied)
      return
    }

    if (params.state.status === "success" && keyName === "right") {
      if (!isThrottleWindowElapsed(params.lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (params.state.transactionsLoading || params.state.transactionsPage >= params.state.transactionsTotalPages) {
        return
      }

      void params.loadTransactionsPage(params.state.transactionsPage + 1)
      return
    }

    if (params.state.status === "success" && keyName === "left") {
      if (!isThrottleWindowElapsed(params.lastPaginationKeyAtRef, PAGINATION_THROTTLE_MS)) {
        return
      }

      if (params.state.transactionsLoading || params.state.transactionsPage <= 1) {
        return
      }

      void params.loadTransactionsPage(params.state.transactionsPage - 1)
    }
  })
}
