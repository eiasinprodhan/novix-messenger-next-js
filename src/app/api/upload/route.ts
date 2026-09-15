import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getUserFromRequest } from '@/lib/auth';

// Simple local upload for MVP
// In production use Cloudinary / S3 / Vercel Blob

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

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 25MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/aac': 'aac',
      'audio/x-aac': 'aac',
      'audio/x-m4a': 'm4a',
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a',
      'application/pdf': 'pdf',
    };
    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    const ext = fileExt || extMap[file.type] || 'bin';

    let prefix = 'file';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      prefix = 'img';
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm'].includes(ext)) {
      prefix = 'audio';
    }

    const filename = `${prefix}_${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      filename,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
