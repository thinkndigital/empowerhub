import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = req.nextUrl.searchParams.get('scope');
    const hostIdParam = req.nextUrl.searchParams.get('hostId');

    let snap;
    if (hostIdParam) {
      snap = await adminDb.collection('sessions')
        .where('hostId', '==', hostIdParam)
        .get();
    } else if (scope === 'all') {
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      const role = userSnap.data()?.role;
      const orgId = userSnap.data()?.organizationId || (decoded as any).organizationId;
      if (role !== 'organization' || !orgId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      snap = await adminDb.collection('sessions')
        .where('organizationId', '==', orgId)
        .get();
    } else {
      snap = await adminDb.collection('sessions')
        .where('hostId', '==', decoded.uid)
        .get();
    }

    const sessions = snap.docs
      .map(d => {
        const data = d.data();
        let date = data.date;
        if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
          date = new Date((date._seconds ?? date.seconds) * 1000).toISOString();
        }
        return { id: d.id, ...data, date };
      })
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const ref = await adminDb.collection('sessions').add({
      ...body,
      hostId: decoded.uid,
      createdAt: new Date().toISOString(),
    });

    const now = FieldValue.serverTimestamp();
    const attendees: string[] = Array.isArray(body.attendees) ? body.attendees : [];
    const sessionTitle: string = body.title || 'جلسة جديدة';

    // Notify each attendee
    const attendeeNotifications = attendees.map((attendeeId: string) =>
      adminDb.collection('notifications').add({
        userId: attendeeId,
        type: 'session_invite',
        title: 'دعوة جلسة جديدة',
        body: `تمت دعوتك لجلسة: ${sessionTitle}`,
        link: '/beneficiary-dashboard/sessions',
        read: false,
        createdAt: now,
      })
    );

    // Notify org users with the same orgId
    const orgId = decoded.organizationId as string | undefined;
    let orgNotifications: Promise<unknown>[] = [];
    if (orgId) {
      const orgUsersSnap = await adminDb.collection('users')
        .where('role', '==', 'organization')
        .where('organizationId', '==', orgId)
        .get();
      orgNotifications = orgUsersSnap.docs.map((d) =>
        adminDb.collection('notifications').add({
          userId: d.id,
          type: 'session_created',
          title: 'جلسة جديدة في منظمتك',
          body: `تم إنشاء جلسة جديدة: ${sessionTitle}`,
          link: '/organization-dashboard/sessions',
          read: false,
          createdAt: now,
        })
      );
    }

    await Promise.all([...attendeeNotifications, ...orgNotifications]);

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const { id, ...fields } = await req.json();
    await adminDb.collection('sessions').doc(id).update(fields);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    await adminDb.collection('sessions').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
