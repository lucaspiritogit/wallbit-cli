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
  apiKey: string | null
  renderer: RendererLike
  setApiKeyInput: Dispatch<SetStateAction<string>>
  setAuthError: Dispatch<SetStateAction<string | null>>
}

export function useApiKeyPaste(params: UseApiKeyPasteParams) {
  const apiKey = params.apiKey
  const renderer = params.renderer
  const setApiKeyInput = params.setApiKeyInput
  const setAuthError = params.setAuthError

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
  }, [apiKey, renderer, setApiKeyInput, setAuthError])
}
