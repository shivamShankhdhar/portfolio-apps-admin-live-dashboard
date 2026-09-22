import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Message from '@/models/Message';

export async function GET() {
  try {
    if (!isDbConfigured()) return NextResponse.json([]);
    await connectDB();
    const messages = await Message.find().sort({ createdAt: -1 });
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const body = await request.json();
    const message = new Message(body);
    const saved = await message.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
