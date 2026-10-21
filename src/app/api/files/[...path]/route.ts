import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUploadsDir, contentTypeFor } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const segments = params.path || [];
  // Reject any path-traversal attempt (`..`) before touching the filesystem.
  if (segments.some(s => s === '..' || s.includes('\0'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, ...segments);
  if (!filePath.startsWith(path.resolve(uploadsDir))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data as any, {
      headers: {
        'Content-Type': contentTypeFor(filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
