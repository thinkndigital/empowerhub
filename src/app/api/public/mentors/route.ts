import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const [mentorsSnap, coachesSnap] = await Promise.all([
      adminDb.collection('users').where('role', '==', 'mentor').limit(4).get(),
      adminDb.collection('users').where('role', '==', 'coach').limit(4).get(),
    ]);
    const pick = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = d.data();
      return { id: d.id, name: data.name, displayName: data.displayName, bio: data.bio, description: data.description, specializations: data.specializations, avatarUrl: data.avatarUrl };
    };
    return NextResponse.json({
      mentors: mentorsSnap.docs.map(pick),
      coaches: coachesSnap.docs.map(pick),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
