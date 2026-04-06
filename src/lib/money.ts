export function formatCents(amountCents: number) {
  const sign = amountCents < 0 ? "-" : "";
  const absoluteValue = Math.abs(amountCents);

  return `${sign}${(absoluteValue / 100).toFixed(2)}`;
}

export function parseAmountInputToCents(rawValue: string) {
  const normalizedValue = rawValue.trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return null;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue * 100);
}
