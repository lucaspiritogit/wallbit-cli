import { useKeyboard } from "@opentui/react"
import type { Dispatch, SetStateAction } from "react"
import { PAGINATION_THROTTLE_MS } from "../constants"
import { getPrintableText, isHelpShortcut, isThrottleWindowElapsed } from "../helpers"
import type { AppState, AssetsModalState, WalletsModalState } from "../types"

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
  authMode: "wallbit" | "ai-provider" | null
  authInput: string
  setAuthInput: Dispatch<SetStateAction<string>>
  setAuthError: Dispatch<SetStateAction<string | null>>
  submitAuthInput: () => Promise<void>
  helpModalOpen: boolean
  setHelpModalOpen: Dispatch<SetStateAction<boolean>>
  hideValues: boolean
  setHideValues: Dispatch<SetStateAction<boolean>>
  state: AppState
  assetsModal: AssetsModalState
  setAssetsModal: Dispatch<SetStateAction<AssetsModalState>>
  walletsModal: WalletsModalState
  setWalletsModal: Dispatch<SetStateAction<WalletsModalState>>
  copySelectedWallet: (index: number) => void
  lastPaginationKeyAtRef: { current: number }
  loadTransactionsPage: (page: number) => Promise<void>
  loadAssetsPage: (page: number, searchQuery: string) => Promise<void>
  openAssetPreview: (symbol: string) => Promise<void>
  chatFocused: boolean
  setChatFocused: Dispatch<SetStateAction<boolean>>
  chatEnabled: boolean
  chatScrollOffset: number
  setChatScrollOffset: Dispatch<SetStateAction<number>>
}

export function useAppKeyboard(params: UseAppKeyboardParams) {
  useKeyboard((key: AppKeyEvent) => {
    const keyName = key.name.toLowerCase()
    if (params.chatFocused) {
      if (keyName === "escape") {
        params.setChatFocused(false)
        return
      }

      if (keyName === "up") {
        params.setChatScrollOffset((current) => current + 3)
        return
      }

      if (keyName === "down") {
        params.setChatScrollOffset((current) => Math.max(0, current - 3))
        return
      }

      if (keyName === "pageup") {
        params.setChatScrollOffset((current) => current + 12)
        return
      }

      if (keyName === "pagedown") {
        params.setChatScrollOffset((current) => Math.max(0, current - 12))
        return
      }

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

    if (params.authMode !== null) {
      if (params.authMode === "wallbit") {
        if (keyName === "enter" || keyName === "return") {
          void params.submitAuthInput()
          return
        }

        if (keyName === "backspace" || keyName === "delete") {
          params.setAuthInput((current) => current.slice(0, -1))
          return
        }

        if (!key.ctrl && !key.meta && !key.option) {
          const typedText = getPrintableText(key.sequence)
          if (typedText.length > 0) {
            params.setAuthInput((current) => current + typedText)
            params.setAuthError(null)
            return
          }
        }

        return
      }

      return
    }

    if (
      keyName === "c" &&
      params.chatEnabled &&
      params.state.status === "success" &&
      !params.helpModalOpen &&
      !params.assetsModal.open &&
      !params.walletsModal.open &&
      !params.chatFocused
    ) {
      params.setChatFocused(true)
      return
    }

    if (params.walletsModal.open && params.state.status === "success") {
      if (keyName === "down") {
        const nextSelectedIndex = Math.min(params.walletsModal.selectedIndex + 1, Math.max(0, params.state.wallets.length - 1))
        params.setWalletsModal((current) => ({
          ...current,
          selectedIndex: nextSelectedIndex,
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
          status: {
            type: "idle",
            message: "",
          },
        }))
        return
      }

      if (keyName === "c") {
        params.copySelectedWallet(params.walletsModal.selectedIndex)
        return
      }

      if (keyName === "enter" || keyName === "return") {
        params.copySelectedWallet(params.walletsModal.selectedIndex)
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
