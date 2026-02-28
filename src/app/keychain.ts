import { getPassword, setPassword } from "keytar"

const SERVICE_NAME = "wallbit-cli"
const OPENAI_ACCOUNT = "openai-api-key"
const AI_PROVIDER_ACCOUNT = "ai-provider"

type StoredAiProvider = "openai" | "none"

export async function getStoredOpenAiApiKey(): Promise<string | null> {
  const value = await getPassword(SERVICE_NAME, OPENAI_ACCOUNT)
  const trimmedValue = value?.trim()
  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null
}

export async function setStoredOpenAiApiKey(apiKey: string): Promise<void> {
  const trimmedValue = apiKey.trim()
  if (!trimmedValue) {
    throw new Error("OpenAI API key is required.")
  }

  await setPassword(SERVICE_NAME, OPENAI_ACCOUNT, trimmedValue)
}

export async function getStoredAiProvider(): Promise<StoredAiProvider | null> {
  const value = await getPassword(SERVICE_NAME, AI_PROVIDER_ACCOUNT)
  if (value === "openai" || value === "none") {
    return value
  }

  return null
}

export async function setStoredAiProvider(provider: StoredAiProvider): Promise<void> {
  await setPassword(SERVICE_NAME, AI_PROVIDER_ACCOUNT, provider)
}
