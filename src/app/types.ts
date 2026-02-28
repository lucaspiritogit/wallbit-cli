import type {
  AccountDetails,
  Asset,
  CheckingBalance,
  CryptoWallet,
  StockBalance,
  Transaction,
} from "../types/wallbit"

export type AppState =
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

export type AssetsModalState = {
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

export type WalletsModalStatusType = "idle" | "success" | "error"

export type WalletsModalState = {
  open: boolean
  selectedIndex: number
  scrollOffset: number
  status: {
    type: WalletsModalStatusType
    message: string
  }
}
