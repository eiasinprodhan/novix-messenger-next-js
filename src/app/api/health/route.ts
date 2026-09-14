import { NextResponse } from 'next/server';
import { getDB } from '@/lib/sqlite';

export async function GET() {
  let dbStatus = 'ok';
  try {
    const db = getDB();
    db.prepare('SELECT 1').get();
  } catch (err: any) {
    dbStatus = 'error: ' + (err?.message || 'DB query failed');
  }

  return NextResponse.json({ 
    status: 'ok', 
    engine: 'better-sqlite3 (WAL mode)',
    database: dbStatus,
    message: 'Novix Messenger API is running',
    time: new Date().toISOString(),
  });
}
