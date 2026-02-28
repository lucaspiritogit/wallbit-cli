import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { getPrintableText } from "../helpers"

type RendererLike = {
  keyInput: {
    on: (eventName: "paste", listener: (event: { text: string }) => void) => void
    off: (eventName: "paste", listener: (event: { text: string }) => void) => void
  }
}

type UseApiKeyPasteParams = {
  authMode: "wallbit" | "ai-provider" | null
  renderer: RendererLike
  setAuthInput: Dispatch<SetStateAction<string>>
  setAuthError: Dispatch<SetStateAction<string | null>>
}

export function useApiKeyPaste(params: UseApiKeyPasteParams) {
  const authMode = params.authMode
  const renderer = params.renderer
  const setAuthInput = params.setAuthInput
  const setAuthError = params.setAuthError

  useEffect(() => {
    const handlePaste = (event: { text: string }) => {
      if (authMode !== "wallbit") {
        return
      }

      const pastedText = getPrintableText(event.text)
      if (pastedText.length === 0) {
        return
      }

      setAuthInput((current) => current + pastedText)
      setAuthError(null)
    }

    renderer.keyInput.on("paste", handlePaste)

    return () => {
      renderer.keyInput.off("paste", handlePaste)
    }
  }, [authMode, renderer, setAuthInput, setAuthError])
}
