import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Education from '@/models/Education';

export async function GET() {
  try {
    if (!isDbConfigured()) return NextResponse.json([]);
    await connectDB();
    const edus = await Education.find().sort({ startDate: -1 });
    return NextResponse.json(edus);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const body = await request.json();
    const edu = new Education(body);
    const saved = await edu.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
