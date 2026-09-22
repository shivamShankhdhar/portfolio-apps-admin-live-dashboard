import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Experience from '@/models/Experience';

export async function GET() {
  try {
    if (!isDbConfigured()) return NextResponse.json([]);
    await connectDB();
    const experiences = await Experience.find().sort({ startDate: -1 });
    return NextResponse.json(experiences);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const body = await request.json();
    const exp = new Experience(body);
    const saved = await exp.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
