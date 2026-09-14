import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getUserFromRequest } from '@/lib/auth';

// Ephemeral transit uploads directory
const transitDir = path.join(process.cwd(), 'public', 'transit_uploads');

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const filename = `enc_${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    await writeFile(path.join(uploadsDir, filename), buffer);

    if (!existsSync(transitDir)) {
      await mkdir(transitDir, { recursive: true });
    }
    await writeFile(path.join(transitDir, filename), buffer);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      url: imageUrl,
      filename,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Download & optional immediate purge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    const purge = searchParams.get('purge') === 'true';

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    let filePath = path.join(transitDir, filename);
    if (!existsSync(filePath)) {
      // Fallback check in public/uploads if legacy
      const legacyPath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (existsSync(legacyPath)) {
        filePath = legacyPath;
      } else {
        return NextResponse.json({ error: 'File not found or already purged' }, { status: 404 });
      }
    }

    const fileBuffer = await readFile(filePath);

    // If recipient downloaded and purge is requested, delete immediately!
    if (purge) {
      unlink(filePath).catch((err) => console.warn('Failed to purge downloaded file:', err));
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('File fetch error:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

// Explicit purge endpoint: Called by recipient as soon as downloaded and saved locally
export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(transitDir, filename);
    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log(`🗑️ [ZeroStore] Ephemeral transit file purged: ${filename}`);
      return NextResponse.json({ success: true, purged: filename });
    }

    const legacyPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (existsSync(legacyPath)) {
      await unlink(legacyPath);
      return NextResponse.json({ success: true, purged: filename });
    }

    return NextResponse.json({ success: true, message: 'Already removed' });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json({ error: 'Failed to purge file' }, { status: 500 });
  }
}
