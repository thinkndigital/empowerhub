import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const storesSnap = await adminDb.collection('stores').limit(6).get();
    const stores = storesSnap.docs
      .filter(d => !d.data().hidden)
      .map(d => {
        const data = d.data();
        return { id: d.id, name: data.name, logoUrl: data.logoUrl, location: data.location, beneficiaryName: data.beneficiaryName };
      });

    const productsSnap = await adminDb.collection('products').get();
    const products = productsSnap.docs
      .filter(d => !d.data().hidden)
      .map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ stores, products });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
