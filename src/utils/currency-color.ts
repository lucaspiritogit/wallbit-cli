export function getCurrencyColor(currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (normalizedCurrency === "USDC") {
    return "#2775CA";
  }

  if (normalizedCurrency === "USD") {
    return "#22C55E";
  }

  if (normalizedCurrency === "ARS") {
    return "#F3F709";
  }

  if (normalizedCurrency === "EUR") {
    return "#1E3A8A";
  }

  if (normalizedCurrency === "BTC") {
    return "#f35106";
  }

  return "#9CA3AF";
}
