// This route allows serving uploaded images properly if needed
// For MVP, Next.js public folder serves /uploads automatically

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Use /uploads/filename directly' });
}
