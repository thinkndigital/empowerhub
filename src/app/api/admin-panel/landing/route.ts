import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSetting, patchSetting } from '@/lib/app-settings';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  heroTitle: 'منصة التمكين الرقمي',
  heroSubtitle: 'تدريب، إرشاد، وتجارة إلكترونية في مكان واحد',
  heroCtaText: 'ابدأ الآن',
  showMentors: true,
  showProducts: true,
  showTestimonials: true,
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getSetting<any>('landing');
  return NextResponse.json({ config: data ? { ...defaultConfig, ...data } : defaultConfig });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await patchSetting('landing', body);
  return NextResponse.json({ ok: true });
}
