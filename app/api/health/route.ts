import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Novix Messenger API is running',
    time: new Date().toISOString(),
    env: process.env.MONGODB_URI ? 'MONGODB_URI loaded' : 'MONGODB_URI MISSING'
  });
}
