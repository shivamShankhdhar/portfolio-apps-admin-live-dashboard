import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import App from '@/models/App';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const app = await App.findById(id);
    if (!app) {
      return NextResponse.json({ message: 'App not found' }, { status: 404 });
    }

    return NextResponse.json(app);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { message: 'Database not connected. Please check MONGO_URI in .env.local.' },
        { status: 503 }
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const app = await App.findById(id);
    if (!app) {
      return NextResponse.json({ message: 'App not found' }, { status: 404 });
    }

    Object.assign(app, body);
    const updatedApp = await app.save();

    return NextResponse.json(updatedApp);
  } catch (error: any) {
    console.error('Error updating app in admin:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { message: 'Database not connected. Please check MONGO_URI in .env.local.' },
        { status: 503 }
      );
    }

    await connectDB();
    const { id } = await params;

    const app = await App.findByIdAndDelete(id);
    if (!app) {
      return NextResponse.json({ message: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'App deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting app in admin:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
