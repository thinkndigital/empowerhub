import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const snap = await adminDb.collection('products').get();
    const today = new Date('2026-06-19');
    today.setHours(0, 0, 0, 0);

    const toDelete: string[] = [];
    const toKeep: { id: string; name: any; createdAt: any }[] = [];

    snap.docs.forEach(d => {
      const data = d.data();
      let created: Date | null = null;
      if (data.createdAt?._seconds) created = new Date(data.createdAt._seconds * 1000);
      else if (data.createdAt?.seconds) created = new Date(data.createdAt.seconds * 1000);
      else if (typeof data.createdAt === 'string') created = new Date(data.createdAt);

      if (!created || created < today) {
        toDelete.push(d.id);
      } else {
        toKeep.push({ id: d.id, name: data.name, createdAt: created?.toISOString() });
      }
    });

    const batch = adminDb.batch();
    toDelete.forEach(id => batch.delete(adminDb.collection('products').doc(id)));
    await batch.commit();

    return NextResponse.json({ deleted: toDelete.length, kept: toKeep.length, kept_products: toKeep });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
