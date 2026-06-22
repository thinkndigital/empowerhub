import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const now = Timestamp.now();
const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86400000));
const daysFromNow = (n: number) => Timestamp.fromDate(new Date(Date.now() + n * 86400000));

const mentors = [
  {
    role: 'mentor', name: 'د. سارة المحمود', email: 'sara.mahmoud@demo.com',
    bio: 'متخصصة في التطوير المهني وريادة الأعمال مع خبرة تزيد عن 12 عاماً في مجال التدريب والاستشارات. ساعدت أكثر من 200 رائد أعمال على بناء مشاريعهم الناجحة.',
    specializations: ['ريادة الأعمال', 'التسويق الرقمي', 'التطوير المهني'],
    sessionPrice: 50, yearsOfExperience: 12,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara&backgroundColor=b6e3f4',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000001',
    status: 'نشط', createdAt: daysAgo(90),
  },
  {
    role: 'mentor', name: 'أ. خالد العمري', email: 'khaled.omari@demo.com',
    bio: 'مرشد في مجال التكنولوجيا والتحول الرقمي، عمل مع شركات عالمية كبرى وساهم في إطلاق عشرات الشركات الناشئة التقنية في المنطقة العربية.',
    specializations: ['التكنولوجيا', 'التحول الرقمي', 'الشركات الناشئة'],
    sessionPrice: 75, yearsOfExperience: 15,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khaled&backgroundColor=c0aede',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000002',
    status: 'نشط', createdAt: daysAgo(85),
  },
  {
    role: 'mentor', name: 'م. رنا الجابري', email: 'rana.jabri@demo.com',
    bio: 'مهندسة ومرشدة في مجال هندسة البرمجيات وإدارة المنتجات. خبرة واسعة في السوق العربي والدولي مع شغف كبير لتمكين المرأة في مجال التقنية.',
    specializations: ['هندسة البرمجيات', 'إدارة المنتجات', 'تمكين المرأة'],
    sessionPrice: 60, yearsOfExperience: 10,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rana&backgroundColor=ffd5dc',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000003',
    status: 'نشط', createdAt: daysAgo(80),
  },
  {
    role: 'mentor', name: 'د. عمر النجار', email: 'omar.najjar@demo.com',
    bio: 'دكتوراه في إدارة الأعمال، متخصص في الاستراتيجية وإدارة التغيير. يعمل مع المنظمات الكبرى والمتوسطة لتطوير قدراتها وتحقيق أهدافها الاستراتيجية.',
    specializations: ['إدارة الأعمال', 'الاستراتيجية', 'إدارة التغيير'],
    sessionPrice: 100, yearsOfExperience: 20,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=omar&backgroundColor=d1f4cc',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000004',
    status: 'نشط', createdAt: daysAgo(75),
  },
];

const coaches = [
  {
    role: 'coach', name: 'أ. ليلى الحسن', email: 'layla.hassan@demo.com',
    bio: 'مدربة معتمدة في التسويق الرقمي وإدارة وسائل التواصل الاجتماعي. أسست أكاديميتها الخاصة عبر الإنترنت ودرّبت أكثر من 500 متدرب.',
    specializations: ['التسويق الرقمي', 'السوشيال ميديا', 'تسويق المحتوى'],
    sessionPrice: 40, yearsOfExperience: 7,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=layla&backgroundColor=ffdfbf',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000005',
    status: 'نشط', createdAt: daysAgo(70),
  },
  {
    role: 'coach', name: 'م. أحمد سالم', email: 'ahmed.salem@demo.com',
    bio: 'مطور ويب محترف ومدرب في مجال البرمجة وتطوير التطبيقات. متخصص في تقنيات React وNode.js وأدوات الذكاء الاصطناعي.',
    specializations: ['تطوير الويب', 'البرمجة', 'الذكاء الاصطناعي'],
    sessionPrice: 55, yearsOfExperience: 9,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed&backgroundColor=b6e3f4',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000006',
    status: 'نشط', createdAt: daysAgo(65),
  },
  {
    role: 'coach', name: 'أ. نور العبدالله', email: 'nour.abdallah@demo.com',
    bio: 'مصممة جرافيك وUX ومدربة في مجال التصميم البصري وتجربة المستخدم. تؤمن بأن التصميم الجيد يحل المشكلات ويغير الحياة.',
    specializations: ['التصميم الجرافيكي', 'UI/UX', 'هوية الشركات'],
    sessionPrice: 45, yearsOfExperience: 6,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nour&backgroundColor=ffd5dc',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000007',
    status: 'نشط', createdAt: daysAgo(60),
  },
  {
    role: 'coach', name: 'أ. تركي المطيري', email: 'turki.mutairi@demo.com',
    bio: 'خبير في المبيعات وإدارة علاقات العملاء ومدرب معتمد من منظمات دولية. ساعد عشرات الشركات على مضاعفة إيراداتها خلال سنة واحدة.',
    specializations: ['المبيعات', 'إدارة العملاء', 'التفاوض'],
    sessionPrice: 65, yearsOfExperience: 11,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=turki&backgroundColor=c0aede',
    linkedin: 'https://linkedin.com', instagram: '', whatsapp: '+962790000008',
    status: 'نشط', createdAt: daysAgo(55),
  },
];

const courses = [
  {
    title: 'أساسيات التسويق الرقمي من الصفر',
    description: 'تعلم مبادئ التسويق الرقمي الحديث من الأساس: إدارة الإعلانات، تحسين محركات البحث، التسويق بالمحتوى، وقياس الأداء بالأدوات الاحترافية.',
    status: 'published', price: 0, duration: '8 ساعات',
    level: 'مبتدئ', language: 'العربية',
    tags: ['تسويق', 'رقمي', 'سوشيال ميديا'],
    coverImageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
    enrollmentCount: 142, createdAt: daysAgo(50),
  },
  {
    title: 'تطوير تطبيقات الجوال باستخدام React Native',
    description: 'دورة شاملة لتعلم بناء تطبيقات الجوال الاحترافية لنظامي iOS و Android باستخدام React Native. من المفاهيم الأساسية حتى نشر التطبيق على المتاجر.',
    status: 'published', price: 199, duration: '20 ساعة',
    level: 'متوسط', language: 'العربية',
    tags: ['برمجة', 'تطبيقات', 'React Native'],
    coverImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    enrollmentCount: 87, createdAt: daysAgo(45),
  },
  {
    title: 'ريادة الأعمال: من الفكرة إلى الشركة',
    description: 'رحلة متكاملة تبدأ بالفكرة وتنتهي بإطلاق مشروعك الخاص. تشمل البحث في السوق، بناء النموذج التجاري، التمويل والتسويق.',
    status: 'published', price: 0, duration: '12 ساعة',
    level: 'جميع المستويات', language: 'العربية',
    tags: ['ريادة الأعمال', 'مشاريع', 'استراتيجية'],
    coverImageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    enrollmentCount: 215, createdAt: daysAgo(40),
  },
  {
    title: 'التصميم الجرافيكي للمبتدئين باستخدام Canva',
    description: 'تعلم أسس التصميم الجرافيكي وإنشاء تصاميم احترافية باستخدام Canva. مثالي للمبتدئين الذين يريدون تصميم محتوى جذاب لمشاريعهم.',
    status: 'published', price: 49, duration: '6 ساعات',
    level: 'مبتدئ', language: 'العربية',
    tags: ['تصميم', 'جرافيك', 'Canva'],
    coverImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    enrollmentCount: 178, createdAt: daysAgo(35),
  },
  {
    title: 'إتقان Excel وتحليل البيانات',
    description: 'دورة متقدمة في Microsoft Excel تشمل الصيغ المتقدمة، الجداول المحورية، الرسوم البيانية، وتحليل البيانات لاتخاذ قرارات مبنية على الأرقام.',
    status: 'published', price: 99, duration: '10 ساعات',
    level: 'متوسط', language: 'العربية',
    tags: ['Excel', 'بيانات', 'تحليل'],
    coverImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    enrollmentCount: 124, createdAt: daysAgo(30),
  },
];

const liveSessions = [
  {
    title: 'ورشة عمل: كيف تبني علامتك التجارية الشخصية؟',
    description: 'جلسة تفاعلية مع خبراء التسويق الشخصي لمساعدتك على بناء حضور قوي على الإنترنت وتمييز نفسك في سوق العمل التنافسي.',
    status: 'published', price: 0, duration: 90,
    maxParticipants: 50, coachName: 'د. سارة المحمود',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    date: daysFromNow(7), createdAt: daysAgo(10),
  },
  {
    title: 'كيف تطلق متجرك الإلكتروني في أسبوع واحد؟',
    description: 'جلسة عملية نغطي فيها كل خطوات إطلاق متجر إلكتروني ناجح: اختيار المنصة، الدفع الإلكتروني، الشحن والتوصيل، والتسويق الأولي.',
    status: 'published', price: 25, duration: 120,
    maxParticipants: 30, coachName: 'أ. خالد العمري',
    coverImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    date: daysFromNow(14), createdAt: daysAgo(8),
  },
  {
    title: 'مقدمة في الذكاء الاصطناعي للأعمال',
    description: 'تعرف على كيفية استخدام أدوات الذكاء الاصطناعي لتحسين إنتاجيتك وتطوير أعمالك. سنستعرض ChatGPT، Midjourney، وأدوات AI للتسويق.',
    status: 'published', price: 0, duration: 60,
    maxParticipants: 100, coachName: 'م. أحمد سالم',
    coverImageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    date: daysFromNow(3), createdAt: daysAgo(5),
  },
  {
    title: 'أسرار كتابة المحتوى الذي يبيع',
    description: 'ورشة متخصصة في كتابة المحتوى التسويقي المقنع للمواقع، وسائل التواصل الاجتماعي، والإيميل. ستخرج بأدوات ونماذج جاهزة للتطبيق.',
    status: 'published', price: 35, duration: 90,
    maxParticipants: 40, coachName: 'أ. ليلى الحسن',
    coverImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    date: daysFromNow(21), createdAt: daysAgo(3),
  },
];

const articles = [
  {
    title: '10 مهارات يحتاجها سوق العمل الرقمي في 2025',
    excerpt: 'اكتشف المهارات الأكثر طلباً في سوق العمل الحديث وكيف يمكنك اكتسابها بسرعة لتعزيز فرصك المهنية.',
    status: 'published', authorName: 'د. سارة المحمود', authorRole: 'mentor',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara&backgroundColor=b6e3f4',
    coverImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    tags: ['مهارات', 'سوق العمل', 'تطوير مهني'],
    readTime: '5 دقائق', publishedAt: daysAgo(15),
  },
  {
    title: 'كيف تبني شبكة علاقات مهنية قوية في العالم العربي',
    excerpt: 'العلاقات المهنية هي رأس مالك الحقيقي. تعرف على أفضل الاستراتيجيات لبناء شبكة علاقات تفتح أمامك أبواب الفرص.',
    status: 'published', authorName: 'أ. خالد العمري', authorRole: 'mentor',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khaled&backgroundColor=c0aede',
    coverImageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
    tags: ['شبكة علاقات', 'نتورك', 'نجاح مهني'],
    readTime: '7 دقائق', publishedAt: daysAgo(20),
  },
  {
    title: 'دليلك الكامل لإنشاء متجر Etsy ناجح للمنتجات اليدوية',
    excerpt: 'خطوات عملية لإطلاق متجرك على Etsy، اختيار المنتجات، التسعير، التصوير الاحترافي، وتحسين ظهورك في نتائج البحث.',
    status: 'published', authorName: 'أ. ليلى الحسن', authorRole: 'coach',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=layla&backgroundColor=ffdfbf',
    coverImageUrl: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
    tags: ['Etsy', 'منتجات يدوية', 'تجارة إلكترونية'],
    readTime: '8 دقائق', publishedAt: daysAgo(25),
  },
  {
    title: 'من الصفر إلى المحترف: رحلتي في تعلم البرمجة ذاتياً',
    excerpt: 'تجربة شخصية وخريطة طريق للراغبين في دخول مجال البرمجة دون خلفية أكاديمية، مع أفضل الموارد المجانية والمدفوعة.',
    status: 'published', authorName: 'م. أحمد سالم', authorRole: 'coach',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed&backgroundColor=b6e3f4',
    coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    tags: ['برمجة', 'تعلم ذاتي', 'تقنية'],
    readTime: '10 دقائق', publishedAt: daysAgo(30),
  },
];

const projects = [
  {
    title: 'مطلوب مصممون جرافيك للعمل الحر',
    description: 'نبحث عن مصممين موهوبين للعمل على مشاريع تصميم هوية بصرية لشركات ناشئة. فرصة رائعة لبناء بورتفوليو قوي والتكسب من موهبتك.',
    status: 'published', organizationName: 'مؤسسة تمكين الأردن', type: 'عمل حر',
    location: 'عن بُعد', deadline: daysFromNow(30).toDate().toISOString(),
    coverImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    publishedAt: daysAgo(5),
  },
  {
    title: 'فرصة تدريب مدفوع في التسويق الرقمي',
    description: 'برنامج تدريبي مدفوع لمدة 3 أشهر في أحد أكبر وكالات التسويق الرقمي. يشمل التدريب العملي على حملات حقيقية ومنح شهادة معتمدة.',
    status: 'published', organizationName: 'وكالة إبداع للتسويق', type: 'تدريب',
    location: 'عمان، الأردن', deadline: daysFromNow(15).toDate().toISOString(),
    coverImageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
    publishedAt: daysAgo(3),
  },
  {
    title: 'مشروع تطوعي: تعليم الأطفال البرمجة',
    description: 'انضم إلى فريق المتطوعين في تعليم أساسيات البرمجة والتفكير الحسابي للأطفال من 8 إلى 14 سنة في المجتمعات المحتاجة.',
    status: 'published', organizationName: 'جمعية المستقبل الرقمي', type: 'تطوع',
    location: 'الزرقاء، الأردن', deadline: daysFromNow(45).toDate().toISOString(),
    coverImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    publishedAt: daysAgo(7),
  },
  {
    title: 'شراكة استراتيجية: تطوير تطبيق صحي',
    description: 'نبحث عن شريك تقني لتطوير تطبيق صحي يساعد مرضى السكري على تتبع حالتهم الصحية. الفرصة تشمل حصة في الشركة.',
    status: 'published', organizationName: 'مؤسسة رعاية', type: 'شراكة',
    location: 'عن بُعد', deadline: daysFromNow(60).toDate().toISOString(),
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    publishedAt: daysAgo(2),
  },
];

const stores = [
  { name: 'متجر نور للمشغولات اليدوية', beneficiaryName: 'نور الرشيد', location: 'عمان، الأردن', logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=نور&backgroundColor=ffd5dc' },
  { name: 'أكاديمية أحمد للتعليم الرقمي', beneficiaryName: 'أحمد المطيري', location: 'الرياض، السعودية', logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=أكاديمية&backgroundColor=b6e3f4' },
  { name: 'مخبز سارة الصحي', beneficiaryName: 'سارة العلي', location: 'عمان، الأردن', logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=سارة&backgroundColor=d1f4cc' },
];

const products = [
  {
    name: 'سوار مزخرف بالخرز اليدوي', category: 'مشغولات يدوية',
    description: 'سوار مصنوع يدوياً من خرز طبيعي فاخر، متوفر بألوان متعددة. كل سوار فريد ومصنوع بمحبة وإتقان.',
    price: 15, stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
  },
  {
    name: 'قلادة فيروز طبيعي', category: 'مشغولات يدوية',
    description: 'قلادة أنيقة من الفيروز الطبيعي مع سلسلة ذهبية. تصميم عصري يجمع بين الأصالة والحداثة.',
    price: 35, stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  },
  {
    name: 'دورة التسويق بالمحتوى - PDF', category: 'منتجات رقمية',
    description: 'دليل شامل من 80 صفحة يغطي استراتيجيات التسويق بالمحتوى، قوالب جاهزة، وأمثلة عملية من السوق العربي.',
    price: 29, stock: 999,
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80',
  },
  {
    name: 'قوالب إنستغرام جاهزة - 50 تصميم', category: 'منتجات رقمية',
    description: 'مجموعة من 50 قالب إنستغرام احترافي قابل للتخصيص على Canva. مناسبة للأعمال والمدونين ورواد الأعمال.',
    price: 19, stock: 999,
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80',
  },
  {
    name: 'كيك شوكولاتة بلجيكية', category: 'مأكولات ومشروبات',
    description: 'كيك شوكولاتة بلجيكية فاخرة مصنوعة من أجود المكونات. مثالية لحفلات أعياد الميلاد والمناسبات الخاصة.',
    price: 45, stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
  },
  {
    name: 'كوكيز بالقرفة والشوفان', category: 'مأكولات ومشروبات',
    description: 'كوكيز صحية محضرة بالقرفة والشوفان والعسل الطبيعي. بدون سكر مضاف، مناسبة لمن يتبع نظاماً صحياً.',
    price: 18, stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80',
  },
];

const successStories = [
  {
    beneficiaryName: 'منى الزهراني',
    beneficiaryRole: 'رائدة أعمال - صاحبة متجر إلكتروني',
    title: 'من ربة منزل إلى رائدة أعمال ناجحة',
    content: 'لم أكن أتخيل يوماً أن أمتلك مشروعاً خاصاً بي. بعد انضمامي للمنصة وحضور دورات التسويق الرقمي، أطلقت متجري الإلكتروني للمشغولات اليدوية. خلال 6 أشهر، حققت مبيعات تجاوزت 5000 دينار وأصبح لدي عملاء من 3 دول عربية.',
    stars: 5, orgName: 'مؤسسة تمكين الأردن',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mona&backgroundColor=ffd5dc',
    status: 'published', createdAt: daysAgo(20),
  },
  {
    beneficiaryName: 'يوسف المغربي',
    beneficiaryRole: 'مطور تطبيقات - مستقل',
    title: 'كيف تعلمت البرمجة وحصلت على أول عميل دولي',
    content: 'كنت أعمل في وظيفة عادية براتب محدود. بعد إكمال دورة تطوير التطبيقات على EmpowerHub والاستشارات المجانية مع المرشدين، بدأت العمل المستقل. الآن دخلي الشهري ضاعف ثلاث مرات ولدي عملاء من أمريكا وكندا.',
    stars: 5, orgName: 'جمعية الشباب المبدع',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef&backgroundColor=b6e3f4',
    status: 'published', createdAt: daysAgo(30),
  },
  {
    beneficiaryName: 'هند الشمري',
    beneficiaryRole: 'مصممة جرافيك - صاحبة استوديو',
    title: 'شغفي أصبح مصدر دخلي الرئيسي',
    content: 'كنت أحب التصميم كهواية فقط. التحقت بدورة التصميم الجرافيكي والمقابلات مع مرشدي التصميم. اليوم أمتلك استوديو تصميم صغير أخدم فيه 15 عميلاً ثابتاً، وأدرّب مجموعات صغيرة على التصميم.',
    stars: 5, orgName: 'برنامج تمكين المرأة',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hind&backgroundColor=ffdfbf',
    status: 'published', createdAt: daysAgo(40),
  },
  {
    beneficiaryName: 'كريم عبد الرحمن',
    beneficiaryRole: 'منسق مبيعات - موظف بدوام كامل',
    title: 'من باحث عن عمل إلى موظف في شركة عالمية',
    content: 'بعد تخرجي بقيت عاطلاً 8 أشهر. أحد أصدقائي عرّفني على EmpowerHub. التحقت بدورات المبيعات وورش تحسين السيرة الذاتية. بعد 3 أشهر، قُبلت في وظيفة في شركة تقنية دولية براتب أعلى بكثير من توقعاتي.',
    stars: 5, orgName: 'مؤسسة الفرص',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karim&backgroundColor=d1f4cc',
    status: 'published', createdAt: daysAgo(50),
  },
];

export async function POST() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results: Record<string, number> = {};
  const batch = adminDb.batch();

  // Mentors
  const mentorIds: string[] = [];
  for (const m of mentors) {
    const ref = adminDb.collection('users').doc();
    mentorIds.push(ref.id);
    batch.set(ref, { ...m, updatedAt: now });
  }
  results.mentors = mentors.length;

  // Coaches
  const coachIds: string[] = [];
  for (const c of coaches) {
    const ref = adminDb.collection('users').doc();
    coachIds.push(ref.id);
    batch.set(ref, { ...c, updatedAt: now });
  }
  results.coaches = coaches.length;

  await batch.commit();

  // Courses (link to coaches)
  const batch2 = adminDb.batch();
  for (let i = 0; i < courses.length; i++) {
    const ref = adminDb.collection('courses').doc();
    batch2.set(ref, { ...courses[i], createdBy: coachIds[i % coachIds.length], updatedAt: now });
  }
  results.courses = courses.length;

  // Live sessions
  for (const s of liveSessions) {
    const ref = adminDb.collection('live_sessions').doc();
    batch2.set(ref, { ...s, updatedAt: now });
  }
  results.liveSessions = liveSessions.length;

  // Articles
  for (const a of articles) {
    const ref = adminDb.collection('articles').doc();
    batch2.set(ref, { ...a, updatedAt: now });
  }
  results.articles = articles.length;

  // Projects
  for (const p of projects) {
    const ref = adminDb.collection('projects').doc();
    batch2.set(ref, { ...p, updatedAt: now });
  }
  results.projects = projects.length;

  await batch2.commit();

  // Stores and products
  const batch3 = adminDb.batch();
  const storeIds: string[] = [];
  for (const s of stores) {
    const ref = adminDb.collection('stores').doc();
    storeIds.push(ref.id);
    batch3.set(ref, { ...s, hidden: false, createdAt: now });
  }

  for (let i = 0; i < products.length; i++) {
    const ref = adminDb.collection('products').doc();
    const storeId = storeIds[i % storeIds.length];
    batch3.set(ref, {
      ...products[i], storeId, userId: storeId,
      storeName: stores[i % stores.length].name,
      hidden: false, createdAt: now,
    });
  }
  results.stores = stores.length;
  results.products = products.length;

  // Success stories
  for (const s of successStories) {
    const ref = adminDb.collection('successStories').doc();
    batch3.set(ref, { ...s, updatedAt: now });
  }
  results.successStories = successStories.length;

  await batch3.commit();

  return NextResponse.json({ ok: true, seeded: results });
}

export async function DELETE() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const collections = ['articles', 'live_sessions', 'projects', 'courses', 'successStories', 'stores', 'products'];
  const results: Record<string, number> = {};

  for (const col of collections) {
    const snap = await adminDb.collection(col).limit(200).get();
    if (snap.empty) { results[col] = 0; continue; }
    const batch = adminDb.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    results[col] = snap.size;
  }

  // Delete demo users (those with @demo.com emails)
  const demoUsers = await adminDb.collection('users').where('email', '>=', 'a@demo.com').where('email', '<=', 'z@demo.com').get();
  if (!demoUsers.empty) {
    const batch = adminDb.batch();
    demoUsers.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    results.users = demoUsers.size;
  }

  return NextResponse.json({ ok: true, deleted: results });
}
