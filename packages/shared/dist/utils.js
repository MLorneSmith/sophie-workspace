/**
 * Check if the code is running in a browser environment.
 */
export function isBrowser() {
    return typeof window !== "undefined";
}
/**
 * @name formatCurrency
 * @description Format the currency based on the currency code
 */
export function formatCurrency(params) {
    const [lang, region] = params.locale.split("-");
    return new Intl.NumberFormat(region !== null && region !== void 0 ? region : lang, {
        style: "currency",
        currency: params.currencyCode,
    }).format(Number(params.value));
}
