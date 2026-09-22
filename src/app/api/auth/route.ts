import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isDbConfigured, connectDB } from '@/lib/db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 's.shankhdhar1981@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'portfolio-super-secret-key-2026';

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

    return NextResponse.json({
      dbConfigured: dbStatus,
      dbConnected,
      authenticated,
      email: userEmail,
      adminEmail: ADMIN_EMAIL,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const isEmailValid = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
    const isPassValid = password === ADMIN_PASSWORD;

    if (!isEmailValid || !isPassValid) {
      return NextResponse.json(
        { message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate JWT Token valid for 7 days
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin' },
      ADMIN_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      email: ADMIN_EMAIL,
      message: 'Admin authentication successful',
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
