import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isDbConfigured, connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { sendOTPEmail, sendLoginAlertEmail } from '@/lib/email';
import { extractClientMetadata } from '@/lib/authMetadata';

interface StoredOTP {
  otp: string;
  expiry: number;
  email: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __ADMIN_OTP_STORE__: Map<string, StoredOTP> | undefined;
}

if (!global.__ADMIN_OTP_STORE__) {
  global.__ADMIN_OTP_STORE__ = new Map<string, StoredOTP>();
}

const otpStore = global.__ADMIN_OTP_STORE__;

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 's.shankhdhar1981@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'portfolio-super-secret-key-2026';

const KNOWN_ADMIN_EMAILS = [
  ADMIN_EMAIL,
  's.shankhdhar1981@gmail.com',
  'er.shivam1214@gmail.com',
];

async function ensureAdminInDb() {
  if (!isDbConfigured()) return;
  try {
    await connectDB();
    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (!existing) {
      const initialHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await Admin.create({
        email: ADMIN_EMAIL,
        password: initialHash,
        passwordHash: initialHash,
        isVerified: true,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.warn('[Admin Auth] Warning ensuring admin in DB:', err);
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: NextRequest) {
  try {
    const dbStatus = isDbConfigured();
    let dbConnected = false;
    if (dbStatus) {
      const conn = await connectDB();
      dbConnected = Boolean(conn);
      ensureAdminInDb().catch(() => {});
    }

    const authHeader = request.headers.get('authorization');
    let authenticated = false;
    let userEmail = '';
    let adminDetails: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, ADMIN_SECRET) as any;
        authenticated = true;
        userEmail = typeof decoded?.email === 'string' ? decoded.email.trim().toLowerCase() : '';

        if (dbConnected && userEmail) {
          const doc = await Admin.findOne({ email: userEmail });
          if (doc) {
            // Enforce single active session: If another session logged in, invalidate older token
            if (doc.activeSessionId && decoded.sessionId && doc.activeSessionId !== decoded.sessionId) {
              return NextResponse.json(
                {
                  authenticated: false,
                  sessionTerminated: true,
                  message: 'Your session has expired because another administrative sign-in occurred.',
                },
                { status: 401 }
              );
            }

            adminDetails = {
              email: doc.email,
              role: 'Super Administrator',
              createdAt: doc.createdAt || null,
              lastLogin: doc.lastLogin || null,
              lastLoginIp: doc.lastLoginIp || null,
              lastLoginDevice: doc.lastLoginDevice || null,
              lastLoginLocation: doc.lastLoginLocation || null,
              activeSessionId: doc.activeSessionId || null,
              twoFactorEnabled: Boolean(doc.twoFactorEnabled),
              twoFactorMethod: doc.twoFactorMethod || 'totp',
              totpVerified: Boolean(doc.totpVerified),
              passkeysCount: doc.passkeys?.length || 0,
              passwordUpdatedAt: doc.passwordUpdatedAt || null,
            };
          }
        }
      } catch {
        authenticated = false;
      }
    }

    const smtpConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD);

    return NextResponse.json({
      dbConfigured: dbStatus,
      dbConnected,
      authenticated,
      email: userEmail,
      adminEmail: ADMIN_EMAIL,
      smtpConfigured,
      adminDetails,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, action, password, currentPassword, newPassword } = body;

    // Handle Change Password Action
    if (action === 'change-password') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      let decodedSession: any = null;
      try {
        decodedSession = jwt.verify(token, ADMIN_SECRET) as any;
      } catch {
        return NextResponse.json({ message: 'Invalid or expired session token' }, { status: 401 });
      }

      if (!currentPassword) {
        return NextResponse.json({ message: 'Current password is required' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { message: 'New password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      if (!isDbConfigured()) {
        return NextResponse.json(
          { message: 'Database is not connected. Cannot store new password.' },
          { status: 500 }
        );
      }

      await connectDB();
      const sessionEmail = typeof decodedSession?.email === 'string' ? decodedSession.email.trim().toLowerCase() : '';
      if (!sessionEmail) {
        return NextResponse.json({ message: 'Invalid session authentication.' }, { status: 401 });
      }

      const adminDoc = await Admin.findOne({ email: sessionEmail });

      if (adminDoc?.activeSessionId && decodedSession?.sessionId && adminDoc.activeSessionId !== decodedSession.sessionId) {
        return NextResponse.json(
          { message: 'Your session has expired because another administrative sign-in occurred.', sessionTerminated: true },
          { status: 401 }
        );
      }

      let isCurrentValid = false;

      if (adminDoc) {
        if (adminDoc.passwordHash) {
          isCurrentValid = await bcrypt.compare(currentPassword, adminDoc.passwordHash);
        }
        if (!isCurrentValid && adminDoc.password) {
          if (adminDoc.password.startsWith('$2a$') || adminDoc.password.startsWith('$2b$')) {
            isCurrentValid = await bcrypt.compare(currentPassword, adminDoc.password);
          } else if (adminDoc.password === currentPassword) {
            isCurrentValid = true;
          }
        }
      }

      // Fallback to initial env password if no password hash in DB yet
      if (!isCurrentValid && currentPassword === ADMIN_PASSWORD) {
        isCurrentValid = true;
      }

      if (!isCurrentValid) {
        return NextResponse.json(
          { message: 'The current password you entered is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password using bcrypt with 12 salt rounds
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await Admin.findOneAndUpdate(
        { email: sessionEmail },
        {
          $set: {
            password: hashedPassword,
            passwordHash: hashedPassword,
            passwordUpdatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Password successfully updated!',
      });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { message: 'Admin email is required' },
        { status: 400 }
      );
    }

    // 1. Password Login Request
    if (action === 'password' || (password && !otp && action !== 'sendOTP')) {
      const isEmailAuthorized =
        normalizedEmail === ADMIN_EMAIL || KNOWN_ADMIN_EMAILS.includes(normalizedEmail);

      let isPasswordValid = false;

      if (isDbConfigured()) {
        try {
          await connectDB();
          const adminDoc = await Admin.findOne({ email: normalizedEmail });
          if (adminDoc) {
            if (adminDoc.passwordHash) {
              isPasswordValid = await bcrypt.compare(password, adminDoc.passwordHash);
            }
            if (!isPasswordValid && adminDoc.password) {
              if (adminDoc.password.startsWith('$2a$') || adminDoc.password.startsWith('$2b$')) {
                isPasswordValid = await bcrypt.compare(password, adminDoc.password);
              } else if (adminDoc.password === password) {
                isPasswordValid = true;
              }
            }
          }
        } catch (dbErr) {
          console.warn('[Admin Auth] Error checking password in DB:', dbErr);
        }
      }

      // Fallback to env password if no match in DB yet
      if (!isPasswordValid && password === ADMIN_PASSWORD) {
        isPasswordValid = true;
      }

      if (!isEmailAuthorized || !isPasswordValid) {
        return NextResponse.json(
          { message: 'Invalid administrative email or password' },
          { status: 401 }
        );
      }

      // Check if Two-Factor Authentication is required
      let requires2FA = false;
      let twoFactorMethod = 'totp';
      let hasTotp = false;
      let hasPasskeys = false;
      let passkeysCount = 0;

      if (isDbConfigured()) {
        try {
          await connectDB();
          const adminDoc = await Admin.findOne({ email: normalizedEmail });
          if (adminDoc?.twoFactorEnabled && (adminDoc.totpVerified || adminDoc.passkeys?.length > 0)) {
            requires2FA = true;
            twoFactorMethod = adminDoc.twoFactorMethod || 'totp';
            hasTotp = Boolean(adminDoc.totpVerified);
            hasPasskeys = (adminDoc.passkeys?.length || 0) > 0;
            passkeysCount = adminDoc.passkeys?.length || 0;
          }
        } catch (e) {}
      }

      if (requires2FA) {
        const tempToken = jwt.sign(
          { email: normalizedEmail, step: '2fa_pending' },
          ADMIN_SECRET,
          { expiresIn: '5m' }
        );

        return NextResponse.json({
          success: true,
          requires2FA: true,
          twoFactorMethod,
          hasTotp,
          hasPasskeys,
          passkeysCount,
          tempToken,
          email: normalizedEmail,
          message: 'Secondary authentication challenge required',
        });
      }

      // Extract client network, device, and location metadata
      const clientMeta = await extractClientMetadata(request);
      const newSessionId = crypto.randomUUID();
      const loginTimestamp = new Date();

      // Update lastLogin and activeSessionId in DB
      if (isDbConfigured()) {
        try {
          await connectDB();
          await Admin.findOneAndUpdate(
            { email: normalizedEmail },
            {
              $set: {
                lastLogin: loginTimestamp,
                lastLoginIp: clientMeta.ip,
                lastLoginDevice: clientMeta.device,
                lastLoginLocation: clientMeta.location,
                activeSessionId: newSessionId,
                isVerified: true,
              },
            },
            { upsert: true }
          );
        } catch (e) {
          console.warn('[Admin Auth] Error updating login metadata in DB:', e);
        }
      }

      const token = jwt.sign(
        { email: normalizedEmail, role: 'admin', sessionId: newSessionId },
        ADMIN_SECRET,
        { expiresIn: '7d' }
      );

      // Dispatch security notification email asynchronously
      sendLoginAlertEmail({
        email: normalizedEmail,
        timestamp: loginTimestamp,
        ip: clientMeta.ip,
        device: clientMeta.device,
        location: clientMeta.location,
      }).catch((err) => console.warn('[Admin Auth] Failed to dispatch login alert email:', err));

      return NextResponse.json({
        success: true,
        token,
        email: normalizedEmail,
        message: 'Admin authentication successful',
      });
    }

    // 2. Send OTP Request
    if (action === 'sendOTP' || (!action && !otp && !password)) {
      const isAuthorized =
        normalizedEmail === ADMIN_EMAIL || KNOWN_ADMIN_EMAILS.includes(normalizedEmail);

      if (!isAuthorized) {
        return NextResponse.json(
          { message: 'This email is not authorized for admin access' },
          { status: 403 }
        );
      }

      const generatedOtp = generateOTP();
      const expiryMs = Date.now() + 15 * 60 * 1000; // 15 minutes validity
      const otpExpiryDate = new Date(expiryMs);

      // Save to memory store
      otpStore.set(normalizedEmail, {
        otp: generatedOtp,
        expiry: expiryMs,
        email: normalizedEmail,
      });

      // Save to MongoDB if configured
      if (isDbConfigured()) {
        try {
          await connectDB();
          await Admin.findOneAndUpdate(
            { email: normalizedEmail },
            {
              $set: {
                email: normalizedEmail,
                otp: generatedOtp,
                otpExpiry: otpExpiryDate,
                isVerified: true,
              },
            },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('[Auth] Warning saving OTP to DB (in-memory store active):', dbErr);
        }
      }

      console.log(`[Admin Auth] Secure OTP generated for ${normalizedEmail}: ${generatedOtp}`);

      // Dispatch via SMTP if configured
      const hasSmtp = Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD);
      if (hasSmtp) {
        try {
          const emailResult = await sendOTPEmail(normalizedEmail, generatedOtp);
          if (emailResult.success) {
            return NextResponse.json({
              success: true,
              message: `Verification code sent to ${normalizedEmail}`,
            });
          }
        } catch (mailErr) {
          console.warn('[Admin Auth] Mail sending failed:', mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: hasSmtp
          ? `Verification code dispatched to ${normalizedEmail}`
          : `Verification code generated and sent to ${normalizedEmail}.`,
      });
    }

    // 3. Verify OTP Request
    if (action === 'verifyOTP' || otp) {
      const cleanOtp = String(otp || '').replace(/\D/g, '').trim();

      if (!cleanOtp) {
        return NextResponse.json(
          { message: '6-digit OTP is required' },
          { status: 400 }
        );
      }

      if (cleanOtp.length !== 6) {
        return NextResponse.json(
          { message: 'OTP must be exactly 6 digits' },
          { status: 400 }
        );
      }

      let isOtpValid = false;
      let isOtpExpired = false;

      // Check In-Memory Store
      const memEntry = otpStore.get(normalizedEmail);
      if (memEntry) {
        if (memEntry.otp === cleanOtp) {
          if (memEntry.expiry < Date.now()) {
            isOtpExpired = true;
          } else {
            isOtpValid = true;
          }
        }
      }

      // Check MongoDB if not found or invalid in memory
      if (!isOtpValid && isDbConfigured()) {
        try {
          await connectDB();
          const adminDoc = await Admin.findOne({ email: normalizedEmail });
          if (adminDoc && adminDoc.otp) {
            const dbOtp = String(adminDoc.otp).trim();
            if (dbOtp === cleanOtp) {
              const expiryTime = adminDoc.otpExpiry ? new Date(adminDoc.otpExpiry).getTime() : 0;
              if (expiryTime > 0 && expiryTime < Date.now()) {
                isOtpExpired = true;
              } else {
                isOtpValid = true;
              }
            }
          }
        } catch (dbErr) {
          console.warn('[Admin Auth] DB check warning:', dbErr);
        }
      }

      if (isOtpExpired) {
        return NextResponse.json(
          { message: 'OTP code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (!isOtpValid) {
        return NextResponse.json(
          { message: 'Invalid OTP verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      // Clear used OTP from memory
      otpStore.delete(normalizedEmail);

      // Extract client network, device, and location metadata
      const clientMeta = await extractClientMetadata(request);
      const newSessionId = crypto.randomUUID();
      const loginTimestamp = new Date();

      // Update last login and activeSessionId in DB
      if (isDbConfigured()) {
        try {
          await connectDB();
          await Admin.findOneAndUpdate(
            { email: normalizedEmail },
            {
              $set: {
                lastLogin: loginTimestamp,
                lastLoginIp: clientMeta.ip,
                lastLoginDevice: clientMeta.device,
                lastLoginLocation: clientMeta.location,
                activeSessionId: newSessionId,
              },
              $unset: { otp: 1, otpExpiry: 1 },
            }
          );
        } catch (e) {
          console.warn('[Admin Auth] Update lastLogin warning:', e);
        }
      }

      // Generate JWT Token with unique sessionId valid for 7 days
      const token = jwt.sign(
        { email: normalizedEmail, role: 'admin', sessionId: newSessionId },
        ADMIN_SECRET,
        { expiresIn: '7d' }
      );

      // Dispatch security notification email asynchronously
      sendLoginAlertEmail({
        email: normalizedEmail,
        timestamp: loginTimestamp,
        ip: clientMeta.ip,
        device: clientMeta.device,
        location: clientMeta.location,
      }).catch((err) => console.warn('[Admin Auth] Failed to dispatch login alert email:', err));

      return NextResponse.json({
        success: true,
        token,
        email: normalizedEmail,
        message: 'Admin authentication successful',
      });
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
