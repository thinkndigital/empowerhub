import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { organizations, plans, subscriptions, users, appSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signAuthToken } from '@/lib/auth-server';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';
import { ensureSchemaAndAdmin } from '@/lib/ensure-schema';

export async function POST(req: NextRequest) {
  try {
    // Auto-create tables (from schema.sql) on first successful DB
    // connection — no manual phpMyAdmin import needed on a fresh deploy.
    await ensureSchemaAndAdmin().catch((e) => console.error('[ensureSchema] skipped:', e?.message));

    const body = await req.json();
    const { name, email, password, role, organizationName, orgInviteCode, plan, billingCycle } = body;
    const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'name, email, password, and role are required' },
        { status: 400 }
      );
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }

    // 1. Reserve the user id up front (needed as organizations.admin_id below).
    const uid = randomUUID();
    let organizationId: string | undefined;

    // 2. If registering as organization admin, create the org row
    let pendingPlanId: string | undefined;
    let pendingPlanPrice = 0;
    if (role === 'organization') {
      organizationId = randomUUID();
      await db.insert(organizations).values({
        id: organizationId,
        name: organizationName || name,
        adminId: uid,
        status: 'active',
        primaryColor: '#2563eb',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        planKey: plan || null,
      });

      // Every new org gets a tracked subscription: a real paid plan starts out
      // "pending" (awaiting payment before it activates), while a free/unmatched
      // plan gets a free trial (length set by the admin) that the daily cron
      // expires automatically unless an admin grants the org permanentFree status.
      let planRowId: string | undefined;
      let planName = plan || '';
      let priceMonthly = 0;
      let priceForCycle = 0;
      if (plan) {
        const [planRow] = await db.select().from(plans).where(eq(plans.key, plan)).limit(1);
        if (planRow) {
          planRowId = planRow.id;
          planName = planRow.name || plan;
          priceMonthly = Number(planRow.priceMonthly || 0);
          priceForCycle = cycle === 'annual' ? Number(planRow.priceAnnual || 0) : priceMonthly;
        }
      }

      if (priceMonthly > 0) {
        pendingPlanId = planRowId;
        pendingPlanPrice = priceForCycle || priceMonthly;
        await db.insert(subscriptions).values({
          organizationId,
          planId: planRowId,
          planKey: plan,
          planName,
          billingCycle: cycle,
          status: 'pending',
        });
      } else {
        const [trialConfig] = await db.select().from(appSettings)
          .where(eq(appSettings.key, 'trial')).limit(1);
        const trialDays = trialConfig?.value?.days || 30;
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        await db.insert(subscriptions).values({
          organizationId,
          planId: planRowId || null,
          planKey: plan || 'free',
          planName: planName || 'خطة مجانية',
          billingCycle: 'monthly',
          price: '0',
          status: 'trial',
          startDate: now,
          endDate: trialEnd,
          permanentFree: false,
        });
      }
    }

    // 3. If registering as mentor/coach with a non-empty invite code, validate and link to org
    if ((role === 'mentor' || role === 'coach') && orgInviteCode && orgInviteCode.trim()) {
      const [matchedOrg] = await db.select().from(organizations)
        .where(eq(organizations.inviteCode, orgInviteCode.trim().toUpperCase())).limit(1);

      if (matchedOrg) {
        const candidateOrgId = matchedOrg.id;
        const lockCheck = await checkOrgLocked(candidateOrgId);
        if (!lockCheck.allowed) {
          return NextResponse.json({ error: lockCheck.message }, { status: 403 });
        }
        const limitCheck = await checkOrgLimit(candidateOrgId, 'maxMentors');
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
        organizationId = candidateOrgId;
      } else {
        return NextResponse.json(
          { error: 'كود الدعوة غير صحيح. تأكد من الكود وحاول مرة أخرى.' },
          { status: 400 }
        );
      }
    }

    // 4. Create the user row
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      id: uid,
      name,
      email,
      passwordHash,
      role,
      status: 'active',
      progress: 0,
      organizationId: organizationId || null,
      displayName: name,
    });

    const token = signAuthToken({ uid, role, organizationId: organizationId || null });

    return NextResponse.json({
      success: true,
      uid,
      token,
      organizationId,
      requiresPayment: !!pendingPlanId,
      planId: pendingPlanId,
      planPrice: pendingPlanPrice,
      message: 'تم إنشاء الحساب بنجاح.',
    });

  } catch (error: any) {
    console.error('Register error:', error?.code, error?.message, 'cause:', error?.cause?.code, error?.cause?.errno, error?.cause?.sqlMessage);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
