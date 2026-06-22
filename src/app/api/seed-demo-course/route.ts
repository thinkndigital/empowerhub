import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'coach') {
      return NextResponse.json({ error: 'يجب أن تكون مدرباً لإنشاء الدورة التجريبية' }, { status: 403 });
    }

    const existing = await adminDb.collection('courses').where('createdBy', '==', decoded.uid).where('title', '==', 'التسويق الرقمي للمبتدئين — من الصفر إلى الاحتراف').get();
    if (!existing.empty) {
      return NextResponse.json({ id: existing.docs[0].id, alreadyExists: true });
    }

    const ref = await adminDb.collection('courses').add({
      title: 'التسويق الرقمي للمبتدئين — من الصفر إلى الاحتراف',
      category: 'التسويق الرقمي',
      description: 'دورة شاملة تأخذك من مفاهيم التسويق الرقمي الأساسية إلى تطبيقها العملي على منصات التواصل الاجتماعي وإعلانات جوجل وفيسبوك. ستتعلم كيف تبني استراتيجية تسويقية متكاملة وتقيس نتائجها.',
      level: 'beginner',
      language: 'arabic',
      price: 49,
      duration: '12 ساعة',
      status: 'منشورة',
      tags: ['تسويق', 'سوشيال ميديا', 'إعلانات رقمية', 'استراتيجية'],
      coverImageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
      coachName: userData.name || userData.displayName || '',
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
      organizationId: userData.organizationId || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
