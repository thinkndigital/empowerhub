import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

// Only the real store owner manages their team — team members (even
// admins) cannot invite/edit/remove other team members in this version.
async function requireOwner(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await adminAuth.verifyIdToken(token);
  const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
  const data = userDoc.data() || {};
  if (data.role === 'merchant_staff') return null;
  return decoded.uid;
}

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}

export async function GET(req: NextRequest) {
  try {
    const ownerId = await requireOwner(req);
    if (!ownerId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const snap = await adminDb.collection('users').where('merchantId', '==', ownerId).get();
    const team = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        email: data.email || '',
        merchantRole: data.merchantRole || 'staff',
        permissions: data.permissions || [],
        status: data.status || 'نشط',
        createdAt: normalizeDate(data.createdAt),
      };
    });

    return NextResponse.json({ team });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireOwner(req);
    if (!ownerId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await req.json();
    const { name, email, merchantRole, permissions } = body;
    if (!name || !email) return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });

    const ownerDoc = await adminDb.collection('users').doc(ownerId).get();
    const ownerName = ownerDoc.data()?.name || 'التاجر';

    const password = 'EmpowerHub@2024';
    const userRecord = await adminAuth.createUser({ email, password, displayName: name });

    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role: 'merchant_staff',
      merchantId: ownerId,
      merchantRole: merchantRole === 'admin' ? 'admin' : 'staff',
      permissions: merchantRole === 'admin' ? [] : (Array.isArray(permissions) ? permissions : []),
      status: 'نشط',
      createdAt: new Date().toISOString(),
    });

    const body_ = `أضافك ${ownerName} كعضو فريق في متجره على EmpowerHub.`;
    try {
      await notifyUser({
        uid: userRecord.uid,
        type: 'welcome',
        title: 'تمت إضافتك لفريق المتجر',
        body: body_,
        link: '/merchant-dashboard',
        email: {
          subject: 'تمت إضافتك لفريق المتجر على EmpowerHub',
          bodyHtml: `${body_}<br/><br/><strong>البريد الإلكتروني:</strong> ${email}<br/><strong>كلمة المرور المؤقتة:</strong> ${password}`,
          ctaText: 'تسجيل الدخول',
          ctaLink: `${SITE_URL}/login`,
        },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (e: any) {
    if (e.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ownerId = await requireOwner(req);
    if (!ownerId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await req.json();
    const { memberId, merchantRole, permissions } = body;
    if (!memberId) return NextResponse.json({ error: 'memberId مطلوب' }, { status: 400 });

    const memberDoc = await adminDb.collection('users').doc(memberId).get();
    if (!memberDoc.exists || memberDoc.data()?.merchantId !== ownerId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    await adminDb.collection('users').doc(memberId).update({
      merchantRole: merchantRole === 'admin' ? 'admin' : 'staff',
      permissions: merchantRole === 'admin' ? [] : (Array.isArray(permissions) ? permissions : []),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ownerId = await requireOwner(req);
    if (!ownerId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await req.json();
    const { memberId } = body;
    if (!memberId) return NextResponse.json({ error: 'memberId مطلوب' }, { status: 400 });

    const memberDoc = await adminDb.collection('users').doc(memberId).get();
    if (!memberDoc.exists || memberDoc.data()?.merchantId !== ownerId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    await adminDb.collection('users').doc(memberId).delete();
    await adminAuth.updateUser(memberId, { disabled: true }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
