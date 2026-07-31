/**
 * Formatting utilities for the Insider Investe dashboard.
 * All monetary values are in USD (displayed as BRL-formatted for readability).
 */

/**
 * Formats a USD value with Brazilian number formatting:
 * $ symbol, dot as thousand separator, comma as decimal.
 * e.g. 10000 → "$10.000,00"
 */
export const formatUSD = (n: number, decimals = 2): string => {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
  return `$${formatted}`;
};

export const formatBRL = (n: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const formatPct = (n: number, decimals = 2): string =>
  `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;

/** Formats "YYYY-MM-DD" or ISO string → "21/05/2026" */
export const formatDate = (iso: string): string => {
  if (!iso) return "—";
  // If already in YYYY-MM-DD format, parse directly to avoid timezone issues
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
};

/** Formats "HH:MM:SS" → "HH:MM" */
export const formatTime = (hms: string): string => {
  if (!hms) return "—";
  return hms.slice(0, 5);
};

/** Formats a UTC ISO timestamp into a human-readable relative time in pt-BR */
export const formatRelativeTime = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} dias`;
};

/** Formats contract quantity: "1" if integer, "0,69" if decimal */
export const formatContracts = (n: number): string =>
  n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace(".", ",");
