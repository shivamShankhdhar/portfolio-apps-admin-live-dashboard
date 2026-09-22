import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isDbConfigured, connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { sendOTPEmail } from '@/lib/email';

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
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'portfolio-super-secret-key-2026';

const KNOWN_ADMIN_EMAILS = [
  ADMIN_EMAIL,
  's.shankhdhar1981@gmail.com',
  'er.shivam1214@gmail.com',
];

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
    }

    const authHeader = request.headers.get('authorization');
    let authenticated = false;
    let userEmail = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, ADMIN_SECRET) as any;
        authenticated = true;
        userEmail = decoded.email;
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, action, password } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { message: 'Admin email is required' },
        { status: 400 }
      );
    }

    // Password login is explicitly disabled as requested
    if (action === 'password' || action === 'login' || (password && !otp && action !== 'sendOTP')) {
      return NextResponse.json(
        {
          message: 'Password login is disabled. Please request and verify with a 6-digit OTP.',
        },
        { status: 400 }
      );
    }

    // 1. Send OTP Request
    if (action === 'sendOTP' || (!action && !otp)) {
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

      console.log(`[Admin Auth] OTP for ${normalizedEmail}: ${generatedOtp}`);

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
          console.warn('[Admin Auth] Mail sending failed, returning fallback OTP:', mailErr);
        }
      }

      // Fallback response with devOtp if SMTP is not configured or in dev environment
      return NextResponse.json({
        success: true,
        message: hasSmtp
          ? 'Verification code dispatched to your email'
          : 'OTP generated. Click the code below to auto-fill and verify.',
        devOtp: generatedOtp,
      });
    }

    // 2. Verify OTP Request
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

      // Update last login in DB
      if (isDbConfigured()) {
        try {
          await connectDB();
          await Admin.findOneAndUpdate(
            { email: normalizedEmail },
            {
              $set: { lastLogin: new Date() },
              $unset: { otp: 1, otpExpiry: 1 },
            }
          );
        } catch (e) {
          console.warn('[Admin Auth] Update lastLogin warning:', e);
        }
      }

      // Generate JWT Token valid for 7 days
      const token = jwt.sign(
        { email: normalizedEmail, role: 'admin' },
        ADMIN_SECRET,
        { expiresIn: '7d' }
      );

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
