import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query: FirebaseFirestore.Query = adminDb.collection('payouts');
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snap = await query.get();
    const payouts = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: normalizeDate((d.data() as any).createdAt),
      paidAt: normalizeDate((d.data() as any).paidAt),
    }));

    // Sort newest first in-memory
    payouts.sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return NextResponse.json({ payouts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      userName,
      userRole,
      amount,
      grossAmount,
      commissionAmount,
      orderIds,
      transferReference,
      notes,
    } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'بيانات ناقصة: userId و amount مطلوبان' }, { status: 400 });
    }

    const newPayout = {
      userId,
      userName: userName || '',
      userRole: userRole || '',
      amount: Number(amount),
      grossAmount: Number(grossAmount ?? amount),
      commissionAmount: Number(commissionAmount ?? 0),
      orderIds: orderIds || [],
      status: 'pending',
      paidAt: null,
      transferReference: transferReference || '',
      notes: notes || '',
      createdAt: new Date(),
    };

    const ref = await adminDb.collection('payouts').add(newPayout);

    return NextResponse.json({
      ok: true,
      id: ref.id,
      payout: { id: ref.id, ...newPayout, createdAt: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, transferReference } = body;

    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });
    }

    const docRef = adminDb.collection('payouts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (status === 'paid') updates.paidAt = new Date();
    if (transferReference !== undefined) updates.transferReference = transferReference;

    await docRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
