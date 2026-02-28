import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { SUCCESS_TOAST_MS } from "../constants"
import type { WalletsModalState } from "../types"

type UseWalletsStatusToastParams = {
  walletsModal: WalletsModalState
  setWalletsModal: Dispatch<SetStateAction<WalletsModalState>>
}

export function useWalletsStatusToast(params: UseWalletsStatusToastParams) {
  const walletsModal = params.walletsModal
  const setWalletsModal = params.setWalletsModal

  useEffect(() => {
    if (!walletsModal.open || walletsModal.status.type !== "success") {
      return
    }

    const timeout = setTimeout(() => {
      setWalletsModal((current) => {
        if (!current.open || current.status.type !== "success") {
          return current
        }

        return {
          ...current,
          status: {
            type: "idle",
            message: "",
          },
        }
      })
    }, SUCCESS_TOAST_MS)

    return () => {
      clearTimeout(timeout)
    }
  }, [walletsModal, setWalletsModal])
}
