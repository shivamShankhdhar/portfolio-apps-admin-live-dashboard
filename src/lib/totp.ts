import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random Base32 encoded secret key (typically 32 chars / 160 bits)
 */
export function generateBase32Secret(length = 32): string {
  const bytes = crypto.randomBytes(20);
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }
  let base32 = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return base32.substring(0, length);
}

/**
 * Decode Base32 string to binary Buffer
 */
export function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate RFC 6238 TOTP code for a given secret at current time + offset steps
 */
export function generateTOTP(secret: string, timeStepOffset = 0): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepOffset;
  const key = base32ToBuffer(secret);

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (codeInt % 1000000).toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP token against a Base32 secret with ±1 time-step drift tolerance
 */
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  if (!secret || !token) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  for (let offset = -window; offset <= window; offset++) {
    if (generateTOTP(secret, offset) === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Generate an otpauth:// URI compatible with Google Authenticator, Authy, and 1Password
 */
export function getTOTPUri(email: string, secret: string, issuer = 'ShivamAdmin'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedLabel = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate a high-resolution QR Code data URL for scanning in Authenticator apps
 */
export async function getTOTPQRCode(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#0a0b10',
      light: '#ffffff',
    },
  });
}
