
function fallbackRandomHex(length: number): string {
  console.warn('Crypto not available, using fallback random generation');
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function generateMatchId(): string {
  // Use Web Crypto API if available (Vercel Edge), fallback to Node.js crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Web Crypto API (Edge Runtime)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else if (typeof window === 'undefined') {
    // Node.js environment (server-side)
    try {
      // Dynamic import for Node.js crypto
      const nodeCrypto = eval('require')('crypto');
      return nodeCrypto.randomBytes(16).toString('hex');
    } catch (error) {
      // Fallback to Math.random if crypto is not available
      return fallbackRandomHex(32);
    }
  } else {
    // Browser environment fallback
    return fallbackRandomHex(32);
  }
}

export function generateQRMatchData(
  player1: string,
  player2: string,
  tournamentId: number,
  round: number,
  baseUrl: string
) {
  const matchId = generateMatchId();
  const submitUrl = `${baseUrl}/api/qr-match/submit`;

  return {
    matchId,
    player1,
    player2,
    tournamentId,
    round,
    baseUri: baseUrl,
    submitUrl
  };
}