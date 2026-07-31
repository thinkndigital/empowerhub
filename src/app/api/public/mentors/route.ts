import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [mentorsSnap, coachesSnap] = await Promise.all([
      adminDb.collection('users').where('role', '==', 'mentor').limit(50).get(),
      adminDb.collection('users').where('role', '==', 'coach').limit(50).get(),
    ]);
    const pick = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        id: d.id, name: data.name, displayName: data.displayName,
        bio: data.bio, description: data.description,
        specializations: Array.isArray(data.specializations) ? data.specializations : typeof data.specializations === 'string' && data.specializations ? [data.specializations] : [],
        avatarUrl: data.avatarUrl || '',
        sessionPrice: data.sessionPrice ?? null,
        whatsapp: data.whatsapp || '', linkedin: data.linkedin || data.linkedIn || '',
        instagram: data.instagram || '', email: data.email || '',
        website: data.website || '', twitter: data.twitter || '',
        yearsOfExperience: data.yearsOfExperience ?? null,
        certifications: data.certifications || '',
      };
    };
    return NextResponse.json({
      mentors: mentorsSnap.docs.map(pick),
      coaches: coachesSnap.docs.map(pick),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
