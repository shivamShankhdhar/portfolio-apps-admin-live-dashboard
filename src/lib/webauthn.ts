import crypto from 'crypto';

// In-memory challenge store with 5-minute expiration
declare global {
  // eslint-disable-next-line no-var
  var __WEBAUTHN_CHALLENGES__: Map<string, { challenge: string; expiry: number }> | undefined;
}

if (!global.__WEBAUTHN_CHALLENGES__) {
  global.__WEBAUTHN_CHALLENGES__ = new Map<string, { challenge: string; expiry: number }>();
}

const challengeStore = global.__WEBAUTHN_CHALLENGES__;

export function bufferToBase64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function base64UrlToBuffer(base64url: string): Buffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Generate a random 32-byte cryptographic challenge for WebAuthn
 */
export function generateWebAuthnChallenge(email: string): string {
  const safeEmail = String(email || '').trim().toLowerCase();
  const bytes = crypto.randomBytes(32);
  const challenge = bufferToBase64Url(bytes);
  challengeStore.set(safeEmail, {
    challenge,
    expiry: Date.now() + 5 * 60 * 1000,
  });
  return challenge;
}

/**
 * Verify that a challenge submitted in clientDataJSON matches the active challenge for email
 */
export function verifyWebAuthnChallenge(email: string, clientDataJSONBase64: string): boolean {
  try {
    const safeEmail = String(email || '').trim().toLowerCase();
    const rawBuffer = base64UrlToBuffer(clientDataJSONBase64);
    const clientData = JSON.parse(rawBuffer.toString('utf8'));
    const stored = challengeStore.get(safeEmail);

    if (!stored || stored.expiry < Date.now()) {
      return false;
    }

    if (stored.challenge !== clientData.challenge) {
      return false;
    }

    // Invalidate used challenge
    challengeStore.delete(safeEmail);
    return true;
  } catch (err) {
    console.error('[WebAuthn] Error parsing clientDataJSON:', err);
    return false;
  }
}
