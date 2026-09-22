import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Skill from '@/models/Skill';

export async function GET() {
  try {
    if (!isDbConfigured()) return NextResponse.json([]);
    await connectDB();
    const skills = await Skill.find().sort({ createdAt: -1 });
    return NextResponse.json(skills);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const body = await request.json();
    const skill = new Skill(body);
    const saved = await skill.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
