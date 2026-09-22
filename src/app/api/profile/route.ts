import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Profile from '@/models/Profile';

export async function GET() {
  try {
    if (!isDbConfigured()) return NextResponse.json(null);
    await connectDB();
    const profile = await Profile.findOne();
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const body = await request.json();
    let profile = await Profile.findOne();
    if (profile) {
      Object.assign(profile, body);
      await profile.save();
    } else {
      profile = new Profile(body);
      await profile.save();
    }
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
