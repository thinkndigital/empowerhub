import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('live_sessions').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.status !== 'published') {
      return NextResponse.json({ error: 'الجلسة غير موجودة أو غير متاحة' }, { status: 404 });
    }

    const data = snap.data()!;
    const regsRef = docRef.collection('registrations');

    // Check if max participants reached
    if (data.maxParticipants) {
      const count = (await regsRef.get()).size;
      if (count >= data.maxParticipants) {
        return NextResponse.json({ error: 'اكتمل عدد المشاركين' }, { status: 400 });
      }
    }

    const body = await req.json();
    const { name, email, phone } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    // Prevent duplicate registrations by email
    const existing = await regsRef.where('email', '==', email.trim().toLowerCase()).get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'تم تسجيلك مسبقاً في هذه الجلسة' }, { status: 400 });
    }

    await regsRef.add({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      registeredAt: FieldValue.serverTimestamp(),
      paymentStatus: data.price > 0 ? 'pending' : 'free',
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
