export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try { return val ? BigInt(String(val)) : null; } catch { return null; }
  },

  formatDate: (timestamp: bigint | number): string => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return 'Invalid Date'; }
  },

  formatDuration: (seconds: bigint | number): string => {
    const s = Number(seconds);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const remainingSeconds = s % 60;

    if (days > 0) return `${days} days ${hours} hours ${minutes} minutes`;
    if (hours > 0) return `${hours} hours ${minutes} minutes ${remainingSeconds} seconds`;
    return `${minutes} minutes ${remainingSeconds} seconds`;
  },

  formatAddress: (address: string): string => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  }
};