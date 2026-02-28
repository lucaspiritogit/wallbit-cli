export type CheckingBalance = {
  currency: string
  balance: number
}

export type CheckingBalanceResponse = {
  data: CheckingBalance[]
}

export type StockBalance = {
  symbol: string
  shares: number | string
}

export type StockBalanceResponse = {
  data: StockBalance[]
}

export type CryptoWallet = {
  address: string
  network: string
  currency_code: string
}

export type CryptoWalletsResponse = {
  data: CryptoWallet[]
}

export type Asset = {
  symbol: string
  name: string
  price: number | string
  asset_type?: string | null
  exchange?: string | null
  logo_url?: string | null
  sector?: string | null
  market_cap_m?: string | null
  description?: string | null
  country?: string | null
  ceo?: string | null
  employees?: string | null
}

export type AssetsResponse = {
  data: Asset[]
  pages: number
  current_page: number
  count: number
}

export type AssetResponse = {
  data: Asset
}

export type AccountDetailsAddress = {
  country?: string
}

export type AccountDetails = {
  holder_name?: string
  country?: string
  address?: AccountDetailsAddress | null
}

export type AccountDetailsResponse = {
  data: AccountDetails
}

export type WallbitApiError = {
  error?: string
  message?: string
  code?: string
  details?: Record<string, unknown>
  retry_after?: number
}

export type TransactionCurrency = {
  code: string
  alias: string
}

export type Transaction = {
  uuid: string
  type?: string
  type_id?: string | number
  source_currency?: TransactionCurrency
  dest_currency?: TransactionCurrency
  source_amount?: number | string
  dest_amount?: number | string
  status: string
  created_at: string
  comment: string | null
}

export type TransactionsResponse = {
  data: {
    data: Transaction[]
    pages: number
    current_page: number
    count: number
  }
}
