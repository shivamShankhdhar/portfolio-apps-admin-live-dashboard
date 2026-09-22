import { NextRequest, NextResponse } from 'next/server';
import connectDB, { isDbConfigured } from '@/lib/db';
import App from '@/models/App';
import { defaultApps } from '@/lib/defaultData';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    if (!isDbConfigured()) {
      let filtered = [...defaultApps];
      if (category && category !== 'All') {
        filtered = filtered.filter(
          (a) => a.category.toLowerCase() === category.toLowerCase()
        );
      }
      return NextResponse.json(filtered);
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json(defaultApps);
    }

    // Auto-seed real apps if the database collection is empty
    const totalCount = await App.countDocuments();
    if (totalCount === 0) {
      try {
        const appsToSeed = defaultApps.map((a) => {
          const { _id, ...rest } = a;
          return rest;
        });
        await App.insertMany(appsToSeed);
      } catch (seedErr) {
        console.warn('Admin auto-seed error:', seedErr);
      }
    }

    const query: any = {};
    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (status && status !== 'All') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    const apps = await App.find(query).sort({ order: 1, createdAt: -1 });

    if (!apps || apps.length === 0) {
      return NextResponse.json(defaultApps);
    }

    return NextResponse.json(apps);
  } catch (error: any) {
    console.error('Error fetching apps in admin:', error);
    return NextResponse.json(defaultApps);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { message: 'Database not connected. Please check MONGO_URI in .env.local.' },
        { status: 503 }
      );
    }

    await connectDB();
    const body = await request.json();

    if (!body.title || !body.package) {
      return NextResponse.json(
        { message: 'Title and Package Name are required fields.' },
        { status: 400 }
      );
    }

    // Ensure category defaults to Games if missing
    if (!body.category || body.category.trim() === '') {
      body.category = 'Games';
    }

    // Ensure package is unique or give helpful message
    const existing = await App.findOne({ package: body.package });
    if (existing) {
      return NextResponse.json(
        { message: `An app with package '${body.package}' already exists in database.` },
        { status: 409 }
      );
    }

    const app = new App(body);
    const savedApp = await app.save();

    return NextResponse.json(savedApp, { status: 201 });
  } catch (error: any) {
    console.error('Error creating app in admin:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
