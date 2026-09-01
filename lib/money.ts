/**
 * Shared money formatting. Amounts in the database and gateways are minor units
 * (cents / paise). Display always goes through here so USD and INR cannot drift.
 */

const LOCALES: Record<string, string> = {
    USD: "en-US",
    INR: "en-IN",
};

export function formatMoney(minorUnits: number, currency: string): string {
    const code = currency.toUpperCase();
    const locale = LOCALES[code] ?? "en-US";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(minorUnits / 100);
}

/** Format a major-unit amount already stored as a string or number (event tickets). */
export function formatMajorAmount(major: number | string, currency: string): string {
    const n = typeof major === "string" ? parseFloat(major) : major;
    if (!Number.isFinite(n)) return formatMoney(0, currency);
    return formatMoney(Math.round(n * 100), currency);
}
