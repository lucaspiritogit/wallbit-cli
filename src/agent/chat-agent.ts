import { createOpenAI } from "@ai-sdk/openai"
import { generateText, stepCountIs, tool } from "ai"
import { z } from "zod"
import {
  getAsset,
  getAccountDetails,
  getCheckingBalance,
  getLatestTransactions,
  getStocksBalance,
  getWallets,
} from "../api/wallbit"

type AccountSnapshotToolResult = {
  holderName: string
  checkingBalances: Array<{ currency: string; balance: number }>
  stockPositions: Array<{ symbol: string; shares: number; marketPrice: number | null }>
  walletsCount: number
  recentTransactionsCount: number
}

type AssetQuoteToolResult = {
  symbol: string
  name: string
  price: number
}

function isAccountSnapshotToolResult(value: unknown): value is AccountSnapshotToolResult {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as {
    holderName?: unknown
    checkingBalances?: unknown
    stockPositions?: unknown
    walletsCount?: unknown
    recentTransactionsCount?: unknown
  }

  return (
    typeof candidate.holderName === "string" &&
    Array.isArray(candidate.checkingBalances) &&
    Array.isArray(candidate.stockPositions) &&
    typeof candidate.walletsCount === "number" &&
    typeof candidate.recentTransactionsCount === "number"
  )
}

function formatAccountSnapshot(snapshot: AccountSnapshotToolResult): string {
  const checkingSummary =
    snapshot.checkingBalances.length > 0
      ? snapshot.checkingBalances
          .slice(0, 3)
          .map((item) => `${item.currency} ${Number(item.balance).toFixed(2)}`)
          .join(", ")
      : "none"
  const positionsSummary =
    snapshot.stockPositions.length > 0
      ? snapshot.stockPositions
          .slice(0, 5)
          .map((item) =>
            item.marketPrice === null
              ? `${item.symbol} (${item.shares} shares)`
              : `${item.symbol} (${item.shares} shares @ ${item.marketPrice.toFixed(2)})`,
          )
          .join(", ")
      : "none"

  return [
    `Here is your latest account snapshot for ${snapshot.holderName}:`,
    `Checking balances: ${checkingSummary}.`,
    `Stock positions: ${positionsSummary}.`,
    `Wallets: ${snapshot.walletsCount}. Recent transactions in view: ${snapshot.recentTransactionsCount}.`,
  ].join(" ")
}

function getAgentApiKey(openAiApiKey: string | null): string {
  const apiKey = openAiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use chat.")
  }

  return apiKey
}

function getAgentModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
}

function getAgent(params: { wallbitApiKey: string | null; openAiApiKey: string | null }) {
  const apiKey = getAgentApiKey(params.openAiApiKey)
  const model = getAgentModel()
  const openai = createOpenAI({ apiKey })
  const wallbitSnapshotTool = tool({
    description:
      "Get a concise snapshot of account balances, positions, wallets, and latest transactions from Wallbit.",
    inputSchema: z.object({}),
    async execute(): Promise<AccountSnapshotToolResult> {
      if (!params.wallbitApiKey) {
        throw new Error("Wallbit API key is required to use account tools.")
      }

      const [accountDetails, checkingBalances, stockPositionsRaw, wallets, transactionsPage] = await Promise.all([
        getAccountDetails(params.wallbitApiKey),
        getCheckingBalance(params.wallbitApiKey),
        getStocksBalance(params.wallbitApiKey),
        getWallets(params.wallbitApiKey),
        getLatestTransactions(params.wallbitApiKey, 1, 5),
      ])

      return {
        holderName: accountDetails?.holder_name?.trim() || "Unknown holder",
        checkingBalances: checkingBalances.map((balance) => ({
          currency: balance.currency,
          balance: balance.balance,
        })),
        stockPositions: stockPositionsRaw.map((stock) => ({
          symbol: stock.symbol,
          shares: typeof stock.shares === "number" ? stock.shares : Number(stock.shares) || 0,
          marketPrice:
            typeof stock.current_price === "number"
              ? stock.current_price
              : typeof stock.current_price === "string"
                ? Number(stock.current_price) || null
                : null,
        })),
        walletsCount: wallets.length,
        recentTransactionsCount: transactionsPage.data.length,
      }
    },
  })

  const wallbitAssetQuoteTool = tool({
    description: "Get the latest Wallbit price quote for a stock or asset symbol (for example AAPL or TSLA).",
    inputSchema: z.object({
      symbol: z.string().describe("Ticker symbol such as AAPL"),
    }),
    async execute(input): Promise<AssetQuoteToolResult> {
      if (!params.wallbitApiKey) {
        throw new Error("Wallbit API key is required to use market data tools.")
      }

      const symbol = input.symbol.trim().toUpperCase()
      if (!symbol) {
        throw new Error("Symbol is required.")
      }

      const asset = await getAsset(params.wallbitApiKey, symbol)
      const normalizedPrice = typeof asset.price === "number" ? asset.price : Number(asset.price)
      if (!Number.isFinite(normalizedPrice)) {
        throw new Error(`Invalid price for ${symbol}.`)
      }

      return {
        symbol: asset.symbol || symbol,
        name: asset.name || symbol,
        price: normalizedPrice,
      }
    },
  })

  return {
    model: openai(model),
    tools: {
      get_account_snapshot: wallbitSnapshotTool,
      get_asset_quote: wallbitAssetQuoteTool,
    },
  }
}

type RunWallbitChatParams = {
  prompt: string
  context: string
  wallbitApiKey: string | null
  openAiApiKey: string | null
}

export type WallbitChatResult = {
  output: string
  toolsUsed: string[]
}

export async function runWallbitChat(params: RunWallbitChatParams): Promise<WallbitChatResult> {
  const agent = getAgent({ wallbitApiKey: params.wallbitApiKey, openAiApiKey: params.openAiApiKey })
  let latestSnapshot: AccountSnapshotToolResult | null = null

  const system = [
    "You are a Wallbit CLI trading assistant. Wallbit CLI is a command-line interface for users to interact with their Wallbit account and get insights about their finances and investments. Wallbit is an all-in-one finance platform.",
    "If the user asks for account-specific insight, use the get_account_snapshot tool.",
    "If the user asks for a stock or asset price, use the get_asset_quote tool.",
    "You can access Wallbit data through your tools; do not claim you lack real-time access without trying the relevant tool first.",
    "When you use a tool, mention the key facts you used in your answer.",
    "Do not execute trades without explicit user confirmation.",
  ].join("\n")

  const prompt = [`Account context: ${params.context}`, `User message: ${params.prompt}`].join("\n")

  const result = await generateText({
    model: agent.model,
    system,
    prompt,
    tools: agent.tools,
    stopWhen: stepCountIs(5),
  })

  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      if (toolResult.toolName === "get_account_snapshot" && isAccountSnapshotToolResult(toolResult.output)) {
        latestSnapshot = toolResult.output
      }
    }
  }

  const toolsUsed = Array.from(new Set(result.steps.flatMap((step) => step.toolCalls.map((toolCall) => toolCall.toolName))))
  const output = result.text.trim()
  if (!output) {
    if (latestSnapshot) {
      return {
        output: formatAccountSnapshot(latestSnapshot),
        toolsUsed,
      }
    }

    return {
      output: "I could not generate a response. Please try again.",
      toolsUsed,
    }
  }

  return {
    output,
    toolsUsed,
  }
}
