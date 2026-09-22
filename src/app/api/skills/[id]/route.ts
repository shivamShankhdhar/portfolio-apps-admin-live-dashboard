import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import Skill from '@/models/Skill';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updated = await Skill.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ message: 'Skill not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ message: 'Database not connected' }, { status: 503 });
    await connectDB();
    const { id } = await params;
    const deleted = await Skill.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Skill not found' }, { status: 404 });
    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
