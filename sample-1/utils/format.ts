/**
 * Convert wei amount to token format with proper decimal places
 * @param weiAmount - Amount in wei (string or bigint)
 * @param decimals - Number of decimal places (default: 18 for ETH/most ERC20)
 * @returns Formatted token amount string
 */
export function formatWeiToToken(weiAmount: string | bigint, decimals: number = 18): string {
  try {
    const amount = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
    const divisor = BigInt(10 ** decimals);
    const tokenAmount = Number(amount) / Number(divisor);

    // Format with commas and limit to 2 decimal places
    return tokenAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
}

/**
 * Format token amount with unit
 * @param weiAmount - Amount in wei
 * @param unit - Token unit (e.g., 'TON', 'ETH', 'USDT')
 * @param decimals - Number of decimal places
 * @returns Formatted string with token unit
 */
export function formatTokenAmountWithUnit(weiAmount: string | bigint, unit: string = 'TON', decimals: number = 18): string {
  return `${formatWeiToToken(weiAmount, decimals)} ${unit}`;
}

// Backward compatibility - TON specific functions
export const formatTON = formatWeiToToken;
export const formatTONWithUnit = (weiAmount: string | bigint, decimals: number = 18) =>
  formatTokenAmountWithUnit(weiAmount, 'TON', decimals);

/**
 * Format timestamp as relative time (e.g., "3 hours ago", "2 days ago")
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return "no update in recent month";
  }

  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) {
    return "just now";
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diff < 2592000) { // 30 days
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }
}

/**
 * Format timestamp as absolute date and time
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date and time string
 */
export function formatDateTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return "No update in recent month";
  }

  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Check if a string is a valid URL
 * @param string - String to validate
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}