import type {
  CheckingBalance,
  CheckingBalanceResponse,
  Transaction,
  TransactionsResponse,
  WallbitApiError,
} from "../types/wallbit"

const WALLBIT_API_BASE_URL = "https://api.wallbit.io"

export class WallbitRequestError extends Error {
  readonly status: number
  readonly code?: string
  readonly retryAfter?: number

  constructor(message: string, status: number, code?: string, retryAfter?: number) {
    super(message)
    this.name = "WallbitRequestError"
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

export type TransactionsPage = {
  data: Transaction[]
  pages: number
  currentPage: number
  count: number
}

export async function getCheckingBalance(apiKey: string): Promise<CheckingBalance[]> {
  const response = await fetch(`${WALLBIT_API_BASE_URL}/api/public/v1/balance/checking`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
    },
  })

  if (!response.ok) {
    const errorPayload = (await safeParseError(response)) ?? {}
    const message = getErrorMessage(response.status, errorPayload)

    throw new WallbitRequestError(
      message,
      response.status,
      errorPayload.code,
      errorPayload.retry_after,
    )
  }

  const payload = (await response.json()) as CheckingBalanceResponse
  const balances = Array.isArray(payload.data) ? payload.data : []

  return balances
}

export async function getLatestTransactions(
  apiKey: string,
  page = 1,
  limit = 10,
): Promise<TransactionsPage> {
  const url = new URL(`${WALLBIT_API_BASE_URL}/api/public/v1/transactions`)
  url.searchParams.set("page", String(page))
  url.searchParams.set("limit", String(limit))

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
    },
  })

  if (!response.ok) {
    const errorPayload = (await safeParseError(response)) ?? {}
    const message = getErrorMessage(response.status, errorPayload)

    throw new WallbitRequestError(
      message,
      response.status,
      errorPayload.code,
      errorPayload.retry_after,
    )
  }

  const payload = (await response.json()) as TransactionsResponse
  const transactions = Array.isArray(payload.data?.data) ? payload.data.data : []
  const pages = typeof payload.data?.pages === "number" && payload.data.pages > 0 ? payload.data.pages : 1
  const currentPage =
    typeof payload.data?.current_page === "number" && payload.data.current_page > 0
      ? payload.data.current_page
      : 1
  const count = typeof payload.data?.count === "number" ? payload.data.count : transactions.length

  return {
    data: transactions,
    pages,
    currentPage,
    count,
  }
}

async function safeParseError(response: Response): Promise<WallbitApiError | null> {
  try {
    return (await response.json()) as WallbitApiError
  } catch {
    return null
  }
}

function getErrorMessage(status: number, errorPayload: WallbitApiError): string {
  const fallbackMessage = errorPayload.message ?? "Unexpected API error"

  if (status === 401) {
    return "Unauthorized: check your WALLBIT_API_KEY value."
  }

  if (status === 403) {
    return "Forbidden: your API key needs read permission."
  }

  if (status === 429) {
    if (typeof errorPayload.retry_after === "number") {
      return `Rate limit exceeded: retry in ${errorPayload.retry_after}s.`
    }

    return "Rate limit exceeded: retry shortly."
  }

  return `Request failed (${status}): ${fallbackMessage}`
}
