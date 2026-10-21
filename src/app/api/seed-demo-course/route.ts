import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses, users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const DEMO_TITLE = 'التسويق الرقمي للمبتدئين — من الصفر إلى الاحتراف';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (!userRow || userRow.role !== 'coach') {
      return NextResponse.json({ error: 'يجب أن تكون مدرباً لإنشاء الدورة التجريبية' }, { status: 403 });
    }

    const [existing] = await db.select().from(courses)
      .where(and(eq(courses.createdBy, decoded.uid), eq(courses.title, DEMO_TITLE))).limit(1);
    if (existing) {
      return NextResponse.json({ id: existing.id, alreadyExists: true });
    }

    const id = randomUUID();
    await db.insert(courses).values({
      id,
      title: DEMO_TITLE,
      category: 'التسويق الرقمي',
      description: 'دورة شاملة تأخذك من مفاهيم التسويق الرقمي الأساسية إلى تطبيقها العملي على منصات التواصل الاجتماعي وإعلانات جوجل وفيسبوك. ستتعلم كيف تبني استراتيجية تسويقية متكاملة وتقيس نتائجها.',
      level: 'beginner',
      language: 'arabic',
      price: '49',
      duration: '12 ساعة',
      status: 'published',
      tags: ['تسويق', 'سوشيال ميديا', 'إعلانات رقمية', 'استراتيجية'],
      coverImageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
      coachName: userRow.name || userRow.displayName || '',
      createdBy: decoded.uid,
      enrolledCount: 0,
      completionRate: 0,
      objectives: [
        'فهم أساسيات التسويق الرقمي ومصطلحاته',
        'إنشاء حملات إعلانية على فيسبوك وإنستغرام',
        'تحليل البيانات وقياس أداء الحملات',
        'بناء استراتيجية محتوى فعّالة',
      ],
      requirements: [
        'اتصال بالإنترنت',
        'حساب على وسائل التواصل الاجتماعي',
      ],
      organizationId: userRow.organizationId || null,
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
