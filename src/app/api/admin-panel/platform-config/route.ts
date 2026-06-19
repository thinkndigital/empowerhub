import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  platformName: 'EmpowerHub',
  platformTagline: 'منصة التمكين الرقمي',
  logoUrl: '',
  faviconUrl: '',
  dashboardSections: {
    organization: {
      beneficiaries: true, team: true, mentors: true, coaches: true,
      courses: true, stores: true, orders: true, reports: true, messages: true, settings: true,
    },
    beneficiary: {
      progress: true, courses: true, sessions: true, messages: true,
      store: true, orders: true, settings: true,
    },
    mentor: {
      my_beneficiaries: true, sessions: true, analytics: true,
      messages: true, invitations: true, settings: true,
    },
    coach: {
      courses: true, sessions: true, analytics: true,
      messages: true, invitations: true, settings: true,
    },
  },
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('platform').get();
  const data = snap.exists ? snap.data() as any : {};
  return NextResponse.json({
    config: {
      platformName: data.platformName ?? defaultConfig.platformName,
      platformTagline: data.platformTagline ?? defaultConfig.platformTagline,
      logoUrl: data.logoUrl ?? defaultConfig.logoUrl,
      faviconUrl: data.faviconUrl ?? defaultConfig.faviconUrl,
      dashboardSections: {
        organization: { ...defaultConfig.dashboardSections.organization, ...(data.dashboardSections?.organization || {}) },
        beneficiary: { ...defaultConfig.dashboardSections.beneficiary, ...(data.dashboardSections?.beneficiary || {}) },
        mentor: { ...defaultConfig.dashboardSections.mentor, ...(data.dashboardSections?.mentor || {}) },
        coach: { ...defaultConfig.dashboardSections.coach, ...(data.dashboardSections?.coach || {}) },
      },
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('platform').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
