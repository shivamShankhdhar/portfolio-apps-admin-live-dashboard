import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isDbConfigured, connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { sendLoginAlertEmail } from '@/lib/email';
import { extractClientMetadata } from '@/lib/authMetadata';
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  getTOTPUri,
  getTOTPQRCode,
} from '@/lib/totp';
import {
  generateWebAuthnChallenge,
  verifyWebAuthnChallenge,
  bufferToBase64Url,
} from '@/lib/webauthn';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 's.shankhdhar1981@gmail.com').trim().toLowerCase();
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'portfolio-super-secret-key-2026';

async function verifyBearer(request: NextRequest): Promise<{ email: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET) as any;
    const safeEmail = typeof decoded?.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    if (decoded?.role === 'admin' && safeEmail) {
      if (decoded.sessionId && isDbConfigured()) {
        await connectDB();
        const adminDoc = await Admin.findOne({ email: safeEmail });
        if (adminDoc?.activeSessionId && adminDoc.activeSessionId !== decoded.sessionId) {
          // Invalidate outdated session
          return null;
        }
      }
      return { email: safeEmail };
    }
    return null;
  } catch {
    return null;
  }
}

function verifyTempToken(tempToken: string): { email: string } | null {
  try {
    const decoded = jwt.verify(tempToken, ADMIN_SECRET) as any;
    const safeEmail = typeof decoded?.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    if (decoded?.step === '2fa_pending' && safeEmail) {
      return { email: safeEmail };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/auth/2fa: Retrieve current 2FA status, methods, and registered passkeys
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyBearer(request);
    if (!auth || !auth.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const safeAdminEmail = auth.email.trim().toLowerCase();

    if (!isDbConfigured()) {
      return NextResponse.json({
        twoFactorEnabled: false,
        twoFactorMethod: 'totp',
        totpVerified: false,
        passkeys: [],
      });
    }

    await connectDB();
    const admin = await Admin.findOne({ email: safeAdminEmail });

    return NextResponse.json({
      twoFactorEnabled: Boolean(admin?.twoFactorEnabled),
      twoFactorMethod: admin?.twoFactorMethod || 'totp',
      totpVerified: Boolean(admin?.totpVerified),
      hasTotpSecret: Boolean(admin?.totpSecret),
      passkeys: (admin?.passkeys || []).map((p: any) => ({
        credentialId: p.credentialId,
        deviceName: p.deviceName || 'Biometric Authenticator',
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching 2FA status' }, { status: 500 });
  }
}

/**
 * POST /api/auth/2fa: Manage TOTP, Passkeys, and 2FA login verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // =========================================================================
    // 1. LOGIN CHALLENGE ACTIONS (Authenticated via short-lived tempToken)
    // =========================================================================

    // A. Verify TOTP during login
    if (action === 'login-verify-totp') {
      const { tempToken, code } = body;
      const verified = verifyTempToken(tempToken);
      if (!verified || !verified.email) {
        return NextResponse.json({ message: '2FA session expired. Please sign in again.' }, { status: 401 });
      }

      const safeVerifiedEmail = verified.email.trim().toLowerCase();
      await connectDB();
      const admin = await Admin.findOne({ email: safeVerifiedEmail });

      if (!admin || !admin.totpSecret) {
        return NextResponse.json({ message: 'Authenticator App is not configured.' }, { status: 400 });
      }

      const isValid = verifyTOTP(admin.totpSecret, code);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid 6-digit code. Please check your Authenticator app.' }, { status: 400 });
      }

      // Extract client network, device, and location metadata
      const clientMeta = await extractClientMetadata(request);
      const newSessionId = crypto.randomUUID();
      const loginTimestamp = new Date();

      // Generate final 7-day session token with unique activeSessionId
      const token = jwt.sign(
        { email: safeVerifiedEmail, role: 'admin', sessionId: newSessionId },
        ADMIN_SECRET,
        { expiresIn: '7d' }
      );

      await Admin.findOneAndUpdate(
        { email: safeVerifiedEmail },
        {
          $set: {
            lastLogin: loginTimestamp,
            lastLoginIp: clientMeta.ip,
            lastLoginDevice: clientMeta.device,
            lastLoginLocation: clientMeta.location,
            activeSessionId: newSessionId,
          },
        }
      );

      // Dispatch security notification email asynchronously
      sendLoginAlertEmail({
        email: verified.email,
        timestamp: loginTimestamp,
        ip: clientMeta.ip,
        device: clientMeta.device,
        location: clientMeta.location,
      }).catch((err) => console.warn('[Auth 2FA] Failed to send login alert email:', err));

      return NextResponse.json({
        success: true,
        token,
        email: verified.email,
        message: 'Two-Factor Authentication successful',
      });
    }

    // B. Request Passkey Challenge for Login
    if (action === 'login-passkey-challenge') {
      const { tempToken } = body;
      const verified = verifyTempToken(tempToken);
      if (!verified) {
        return NextResponse.json({ message: '2FA session expired. Please sign in again.' }, { status: 401 });
      }

      await connectDB();
      const admin = await Admin.findOne({ email: verified.email.toLowerCase() });

      if (!admin || !admin.passkeys || admin.passkeys.length === 0) {
        return NextResponse.json({ message: 'No registered biometric passkeys found.' }, { status: 400 });
      }

      const challenge = generateWebAuthnChallenge(verified.email);
      const allowCredentials = admin.passkeys.map((p: any) => ({
        id: p.credentialId,
        type: 'public-key',
        transports: ['internal', 'hybrid'],
      }));

      return NextResponse.json({
        success: true,
        challenge,
        allowCredentials,
      });
    }

    // C. Verify Passkey Assertion for Login
    if (action === 'login-passkey-verify') {
      const { tempToken, credentialId, clientDataJSON } = body;
      const verified = verifyTempToken(tempToken);
      if (!verified) {
        return NextResponse.json({ message: '2FA session expired. Please sign in again.' }, { status: 401 });
      }

      const isChallengeValid = verifyWebAuthnChallenge(verified.email, clientDataJSON);
      if (!isChallengeValid) {
        return NextResponse.json({ message: 'Biometric verification challenge expired or invalid.' }, { status: 400 });
      }

      await connectDB();
      const admin = await Admin.findOne({
        email: verified.email.toLowerCase(),
        'passkeys.credentialId': credentialId,
      });

      if (!admin) {
        return NextResponse.json({ message: 'Biometric passkey not recognized.' }, { status: 400 });
      }

      // Extract client network, device, and location metadata
      const clientMeta = await extractClientMetadata(request);
      const newSessionId = crypto.randomUUID();
      const loginTimestamp = new Date();

      // Generate final 7-day session token with unique activeSessionId
      const token = jwt.sign(
        { email: verified.email, role: 'admin', sessionId: newSessionId },
        ADMIN_SECRET,
        { expiresIn: '7d' }
      );

      await Admin.findOneAndUpdate(
        { email: verified.email.toLowerCase() },
        {
          $set: {
            lastLogin: loginTimestamp,
            lastLoginIp: clientMeta.ip,
            lastLoginDevice: clientMeta.device,
            lastLoginLocation: clientMeta.location,
            activeSessionId: newSessionId,
          },
        }
      );

      // Dispatch security notification email asynchronously
      sendLoginAlertEmail({
        email: verified.email,
        timestamp: loginTimestamp,
        ip: clientMeta.ip,
        device: clientMeta.device,
        location: clientMeta.location,
      }).catch((err) => console.warn('[Auth 2FA] Failed to send login alert email:', err));

      return NextResponse.json({
        success: true,
        token,
        email: verified.email,
        message: 'Passkey verification successful',
      });
    }

    // =========================================================================
    // 2. ADMIN SETTINGS ACTIONS (Authenticated via Bearer Token)
    // =========================================================================

    const auth = await verifyBearer(request);
    if (!auth || !auth.email) {
      return NextResponse.json({ message: 'Unauthorized. Administrative session required.' }, { status: 401 });
    }

    await connectDB();
    const adminEmail = auth.email.trim().toLowerCase();
    if (!adminEmail) {
      return NextResponse.json({ message: 'Unauthorized. Invalid admin session.' }, { status: 401 });
    }

    // A. Generate New TOTP Secret & QR Code
    if (action === 'generate-totp') {
      const secret = generateBase32Secret(32);
      const otpauthUri = getTOTPUri(adminEmail, secret, 'ShivamAdmin');
      const qrCode = await getTOTPQRCode(otpauthUri);

      // Save secret temporarily until confirmed
      await Admin.findOneAndUpdate(
        { email: adminEmail },
        { $set: { totpSecret: secret, totpVerified: false } },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
        otpauthUri,
      });
    }

    // B. Verify and Confirm TOTP Activation
    if (action === 'verify-enable-totp') {
      const { code, secret } = body;
      const cleanCode = String(code || '').trim();
      const cleanSecret = typeof secret === 'string' ? secret.trim() : '';

      const admin = await Admin.findOne({ email: adminEmail });
      const targetSecret = cleanSecret || admin?.totpSecret;

      if (!targetSecret) {
        return NextResponse.json({ message: 'No setup key found. Please set up the Authenticator app again.' }, { status: 400 });
      }

      const isValid = verifyTOTP(targetSecret, cleanCode);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid verification code. Please check your Authenticator app and try again.' }, { status: 400 });
      }

      await Admin.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            totpSecret: targetSecret,
            totpVerified: true,
            twoFactorEnabled: true,
            twoFactorMethod: admin?.passkeys?.length ? 'both' : 'totp',
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Google Authenticator 2FA configured and activated successfully!',
      });
    }

    // C. Register Passkey Options
    if (action === 'passkey-register-options') {
      const challenge = generateWebAuthnChallenge(adminEmail);
      const userIdBuffer = Buffer.from(adminEmail);

      return NextResponse.json({
        success: true,
        options: {
          challenge,
          rp: {
            name: 'Shivam Portfolio Admin Console',
            id: request.nextUrl.hostname,
          },
          user: {
            id: bufferToBase64Url(userIdBuffer),
            name: adminEmail,
            displayName: 'Shivam Shankhdhar (Admin)',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256 (P-256)
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Native Touch ID / Face ID / Windows Hello
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });
    }

    // D. Verify & Save Passkey Registration
    if (action === 'passkey-register-verify') {
      const { credentialId, publicKey, clientDataJSON, deviceName } = body;

      const isChallengeValid = verifyWebAuthnChallenge(adminEmail, clientDataJSON);
      if (!isChallengeValid) {
        return NextResponse.json({ message: 'Biometric challenge verification failed or timed out.' }, { status: 400 });
      }

      const newPasskey = {
        credentialId,
        publicKey: publicKey || credentialId,
        counter: 0,
        deviceName: deviceName || 'Touch ID / Biometric Device',
        createdAt: new Date(),
      };

      const admin = await Admin.findOne({ email: adminEmail });
      const currentMethod = admin?.totpVerified ? 'both' : 'passkey';

      await Admin.findOneAndUpdate(
        { email: adminEmail },
        {
          $push: { passkeys: newPasskey },
          $set: {
            twoFactorEnabled: true,
            twoFactorMethod: currentMethod,
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Touch ID / Fingerprint passkey registered and activated successfully!',
      });
    }

    // E. Delete Passkey
    if (action === 'delete-passkey') {
      const { credentialId } = body;
      await Admin.findOneAndUpdate(
        { email: adminEmail },
        { $pull: { passkeys: { credentialId } } }
      );

      const updated = await Admin.findOne({ email: adminEmail });
      if (!updated?.passkeys?.length && !updated?.totpVerified) {
        await Admin.findOneAndUpdate({ email: adminEmail }, { $set: { twoFactorEnabled: false } });
      } else if (!updated?.passkeys?.length && updated?.totpVerified) {
        await Admin.findOneAndUpdate({ email: adminEmail }, { $set: { twoFactorMethod: 'totp' } });
      }

      return NextResponse.json({ success: true, message: 'Passkey removed.' });
    }

    // F. Master Toggle 2FA On/Off
    if (action === 'toggle-2fa') {
      const { enabled, method } = body;
      const admin = await Admin.findOne({ email: adminEmail });

      if (enabled && !admin?.totpVerified && (!admin?.passkeys || admin.passkeys.length === 0)) {
        return NextResponse.json(
          { message: 'Please configure at least one method (Authenticator App or Biometrics) before enabling 2FA.' },
          { status: 400 }
        );
      }

      await Admin.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            twoFactorEnabled: Boolean(enabled),
            twoFactorMethod: method || admin?.twoFactorMethod || 'totp',
          },
        }
      );

      return NextResponse.json({
        success: true,
        enabled: Boolean(enabled),
        message: enabled ? 'Two-Factor Authentication is now active.' : 'Two-Factor Authentication disabled.',
      });
    }

    return NextResponse.json({ message: 'Invalid 2FA action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error processing 2FA request' }, { status: 500 });
  }
}
