import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { PAGINATION_THROTTLE_MS } from "../constants"
import { getPrintableText, isHelpShortcut, isThrottleWindowElapsed } from "../helpers"
import type { AppState, AssetsModalState, WalletsModalState } from "../types"

type RendererLike = {
  keyInput: {
    on(eventName: "keypress", listener: (event: AppKeyEvent) => void): void
    on(eventName: "paste", listener: (event: AppPasteEvent) => void): void
    off(eventName: "keypress", listener: (event: AppKeyEvent) => void): void
    off(eventName: "paste", listener: (event: AppPasteEvent) => void): void
  }
}

type AppKeyEvent = {
  name: string
  sequence: string
  ctrl: boolean
  meta: boolean
  option: boolean
  shift: boolean
}

type AppPasteEvent = {
  text: string
}

type UseAppKeyboardParams = {
  renderer: RendererLike
  authMode: "wallbit" | "ai-provider" | "openai-key" | null
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
  chatOpen: boolean
  setChatOpen: Dispatch<SetStateAction<boolean>>
  chatEnabled: boolean
  chatScrollOffset: number
  setChatScrollOffset: Dispatch<SetStateAction<number>>
  commandBarEnabled: boolean
  commandBarFocused: boolean
  setCommandBarFocused: Dispatch<SetStateAction<boolean>>
}

export function useAppKeyboard(params: UseAppKeyboardParams) {
  const renderer = params.renderer
  const authMode = params.authMode
  const setAuthInput = params.setAuthInput
  const setAuthError = params.setAuthError
  const submitAuthInput = params.submitAuthInput
  const helpModalOpen = params.helpModalOpen
  const setHelpModalOpen = params.setHelpModalOpen
  const setHideValues = params.setHideValues
  const state = params.state
  const assetsModal = params.assetsModal
  const setAssetsModal = params.setAssetsModal
  const walletsModal = params.walletsModal
  const setWalletsModal = params.setWalletsModal
  const copySelectedWallet = params.copySelectedWallet
  const lastPaginationKeyAtRef = params.lastPaginationKeyAtRef
  const loadTransactionsPage = params.loadTransactionsPage
  const loadAssetsPage = params.loadAssetsPage
  const openAssetPreview = params.openAssetPreview
  const chatOpen = params.chatOpen
  const setChatOpen = params.setChatOpen
  const chatEnabled = params.chatEnabled
  const setChatScrollOffset = params.setChatScrollOffset
  const commandBarEnabled = params.commandBarEnabled
  const commandBarFocused = params.commandBarFocused
  const setCommandBarFocused = params.setCommandBarFocused

  useEffect(() => {
    const handleKeyPress = (key: AppKeyEvent) => {
      const keyName = key.name.toLowerCase()
      const isCommandFocusShortcut = key.sequence === ":" || (keyName === "semicolon" && key.shift)

      if (key.ctrl && keyName === "j" && chatEnabled) {
        setChatOpen((current) => !current)
        return
      }

      if (commandBarEnabled && isCommandFocusShortcut && !commandBarFocused) {
        setCommandBarFocused(true)
        return
      }

      if (commandBarFocused && keyName === "escape") {
        setCommandBarFocused(false)
        return
      }

      if (chatOpen && keyName === "pageup") {
        setChatScrollOffset((current) => current + 12)
        return
      }

      if (chatOpen && keyName === "pagedown") {
        setChatScrollOffset((current) => Math.max(0, current - 12))
        return
      }

      if (commandBarFocused) {
        return
      }

      if (isHelpShortcut(key)) {
        setHelpModalOpen((current) => !current)
        return
      }

      if (keyName === "escape" && helpModalOpen) {
        setHelpModalOpen(false)
        return
      }

      if (keyName === "escape" && assetsModal.open) {
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

      if (keyName === "escape" && walletsModal.open) {
        setWalletsModal((current) => ({
          ...current,
          open: false,
          status: {
            type: "idle",
            message: "",
          },
        }))
        return
      }

      if (authMode === "wallbit" || authMode === "openai-key") {
        if (keyName === "enter" || keyName === "return") {
          void submitAuthInput()
          return
        }

        if (keyName === "backspace" || keyName === "delete") {
          setAuthInput((current) => current.slice(0, -1))
          return
        }

        if (!key.ctrl && !key.meta && !key.option) {
          const typedText = getPrintableText(key.sequence)
          if (typedText.length > 0) {
            setAuthInput((current) => current + typedText)
            setAuthError(null)
            return
          }
        }

        return
      }

      if (walletsModal.open && state.status === "success") {
        if (keyName === "down") {
          const nextSelectedIndex = Math.min(walletsModal.selectedIndex + 1, Math.max(0, state.wallets.length - 1))
          setWalletsModal((current) => ({
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
          const nextSelectedIndex = Math.max(0, walletsModal.selectedIndex - 1)
          setWalletsModal((current) => ({
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
          copySelectedWallet(walletsModal.selectedIndex)
          return
        }

        if (keyName === "enter" || keyName === "return") {
          copySelectedWallet(walletsModal.selectedIndex)
          return
        }

        return
      }

      if (keyName === "h") {
        setHideValues((current) => !current)
        return
      }

      if (keyName === "w" && state.status === "success" && !assetsModal.open && !walletsModal.open) {
        setWalletsModal({
          open: true,
          selectedIndex: 0,
          status: {
            type: "idle",
            message: "",
          },
        })
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
          if (keyName === "escape") {
            setAssetsModal((current) => ({
              ...current,
              searchMode: false,
              searchInput: current.searchApplied,
            }))
            return
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

      if (assetsModal.open && !assetsModal.previewOpen && state.status === "success" && (keyName === "enter" || keyName === "return")) {
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
      }
    }

    const handlePaste = (event: AppPasteEvent) => {
      if (authMode !== "wallbit" && authMode !== "openai-key") {
        return
      }

      const pastedText = getPrintableText(event.text)
      if (pastedText.length === 0) {
        return
      }

      setAuthInput((current) => current + pastedText)
      setAuthError(null)
    }

    renderer.keyInput.on("keypress", handleKeyPress)
    renderer.keyInput.on("paste", handlePaste)

    return () => {
      renderer.keyInput.off("keypress", handleKeyPress)
      renderer.keyInput.off("paste", handlePaste)
    }
  }, [
    assetsModal,
    authMode,
    chatEnabled,
    chatOpen,
    commandBarEnabled,
    commandBarFocused,
    copySelectedWallet,
    helpModalOpen,
    lastPaginationKeyAtRef,
    loadAssetsPage,
    loadTransactionsPage,
    openAssetPreview,
    renderer,
    setAssetsModal,
    setAuthError,
    setAuthInput,
    setChatOpen,
    setChatScrollOffset,
    setCommandBarFocused,
    setHelpModalOpen,
    setHideValues,
    setWalletsModal,
    state,
    submitAuthInput,
    walletsModal,
  ])
}
