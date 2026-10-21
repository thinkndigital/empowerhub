import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { evaluations } from '@/lib/schema';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const { sessionId, evaluatedId, type, rating, comment } = await req.json();
    if (!sessionId || !evaluatedId || !type || !rating) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(evaluations).values({
      id,
      sessionId,
      evaluatorId: decoded.uid,
      evaluatedId,
      type,
      rating: Number(rating),
      comment: comment || null,
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
