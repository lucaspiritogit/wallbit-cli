export type CheckingBalance = {
  currency: string
  balance: number
}

export type CheckingBalanceResponse = {
  data: CheckingBalance[]
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
