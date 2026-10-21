import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses } from '@/lib/schema';
import { randomUUID } from 'crypto';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await verifyAuthToken(token);
  if (decoded.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const rows = await db.select().from(courses);
    return NextResponse.json({ courses: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'Forbidden' ? 403 : 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { title, category, description } = body;
    if (!title || !category) {
      return NextResponse.json({ error: 'العنوان والفئة مطلوبان' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(courses).values({
      id, title, category, description: description || '', status: 'draft',
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
