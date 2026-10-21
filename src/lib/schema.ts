// Drizzle ORM schema — MySQL. Source of truth for the app's table shapes.
// Mirrors schema.sql (same file, kept in sync manually since this is a
// self-hosted shared-hosting deploy with no CLI migration runner available).
import {
  mysqlTable, varchar, int, tinyint, text, boolean, timestamp, json,
  mysqlEnum, decimal, primaryKey, uniqueIndex, index,
} from 'drizzle-orm/mysql-core';

const id = (name = 'id') => varchar(name, { length: 36 }).primaryKey();
const fk = (name: string) => varchar(name, { length: 36 });
const createdAt = () => timestamp('created_at').defaultNow().notNull();

// ── Users & organizations ──────────────────────────────────────────────

export const users = mysqlTable('users', {
  id: id(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'organization', 'mentor', 'coach', 'beneficiary', 'merchant', 'team_member']).notNull(),
  organizationId: fk('organization_id'),
  status: mysqlEnum('status', ['active', 'inactive', 'pending']).default('active').notNull(),
  progress: int('progress').default(0),
  mentorId: fk('mentor_id'),
  coachId: fk('coach_id'),
  groupId: fk('group_id'),
  category: varchar('category', { length: 255 }),
  expertise: varchar('expertise', { length: 255 }),
  avatarUrl: text('avatar_url'),
  displayName: varchar('display_name', { length: 255 }),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({
  orgIdx: index('users_org_idx').on(t.organizationId),
  mentorIdx: index('users_mentor_idx').on(t.mentorId),
  coachIdx: index('users_coach_idx').on(t.coachId),
}));

export const userBlocks = mysqlTable('user_blocks', {
  blockerId: fk('blocker_id').notNull(),
  blockedId: fk('blocked_id').notNull(),
}, t => ({ pk: primaryKey({ columns: [t.blockerId, t.blockedId] }) }));

export const organizations = mysqlTable('organizations', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  adminId: fk('admin_id'),
  status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
  planKey: varchar('plan_key', { length: 100 }),
  inviteCode: varchar('invite_code', { length: 16 }).unique(),
  primaryColor: varchar('primary_color', { length: 20 }),
  logoUrl: text('logo_url'),
  courseSessionPrice: decimal('course_session_price', { precision: 10, scale: 2 }),
  mentorshipSessionPrice: decimal('mentorship_session_price', { precision: 10, scale: 2 }),
  maxUsersOverride: int('max_users_override'),
  maxMentorsOverride: int('max_mentors_override'),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
});

export const plans = mysqlTable('plans', {
  id: id(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }),
  priceAnnual: decimal('price_annual', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('JOD'),
  sortOrder: int('sort_order').default(0),
  maxUsers: int('max_users'),
  maxMentors: int('max_mentors'),
  features: json('features').$type<string[]>(),
  createdAt: createdAt(),
});

export const subscriptions = mysqlTable('subscriptions', {
  organizationId: fk('organization_id').primaryKey(),
  planId: fk('plan_id'),
  planKey: varchar('plan_key', { length: 100 }),
  planName: varchar('plan_name', { length: 255 }),
  billingCycle: mysqlEnum('billing_cycle', ['monthly', 'annual']),
  status: mysqlEnum('status', ['pending', 'trial', 'active', 'expired', 'cancelled']).default('pending').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  permanentFree: boolean('permanent_free').default(false),
  createdAt: createdAt(),
});

export const groups = mysqlTable('groups', {
  id: id(),
  organizationId: fk('organization_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('groups_org_idx').on(t.organizationId) }));

export const groupMembers = mysqlTable('group_members', {
  groupId: fk('group_id').notNull(),
  userId: fk('user_id').notNull(),
}, t => ({ pk: primaryKey({ columns: [t.groupId, t.userId] }) }));

export const orgInvitations = mysqlTable('org_invitations', {
  id: id(),
  organizationId: fk('organization_id').notNull(),
  orgName: varchar('org_name', { length: 255 }),
  targetUid: fk('target_uid'),
  targetName: varchar('target_name', { length: 255 }),
  targetRole: varchar('target_role', { length: 50 }),
  groupName: varchar('group_name', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'accepted', 'rejected']).default('pending').notNull(),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('org_invitations_org_idx').on(t.organizationId) }));

// ── Education ───────────────────────────────────────────────────────────

export const courses = mysqlTable('courses', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  level: varchar('level', { length: 50 }),
  language: varchar('language', { length: 50 }),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  duration: varchar('duration', { length: 100 }),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  coverImageUrl: text('cover_image_url'),
  coachName: varchar('coach_name', { length: 255 }),
  createdBy: fk('created_by'),
  organizationId: fk('organization_id'),
  enrolledCount: int('enrolled_count').default(0),
  completionRate: int('completion_rate').default(0),
  objectives: json('objectives').$type<string[]>(),
  requirements: json('requirements').$type<string[]>(),
  tags: json('tags').$type<string[]>(),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
}, t => ({
  orgIdx: index('courses_org_idx').on(t.organizationId),
  creatorIdx: index('courses_creator_idx').on(t.createdBy),
}));

export const courseLessons = mysqlTable('course_lessons', {
  id: id(),
  courseId: fk('course_id').notNull(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  videoUrl: text('video_url'),
  sortOrder: int('sort_order').default(0),
  createdAt: createdAt(),
}, t => ({ courseIdx: index('course_lessons_course_idx').on(t.courseId) }));

export const enrollments = mysqlTable('enrollments', {
  id: id(),
  courseId: fk('course_id').notNull(),
  userId: fk('user_id').notNull(),
  progress: int('progress').default(0),
  completedLessons: json('completed_lessons').$type<string[]>().default([]),
  assigned: boolean('assigned').default(false),
  enrolledAt: createdAt(),
  enrolledBy: fk('enrolled_by'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({
  uniq: uniqueIndex('enrollments_course_user_uniq').on(t.courseId, t.userId),
  userIdx: index('enrollments_user_idx').on(t.userId),
}));

export const assessments = mysqlTable('assessments', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }),
  questions: json('questions').$type<any[]>(),
  status: mysqlEnum('status', ['draft', 'active']).default('draft').notNull(),
  organizationId: fk('organization_id'),
  createdBy: fk('created_by'),
  orgName: varchar('org_name', { length: 255 }),
  orgLogo: text('org_logo'),
  orgColor: varchar('org_color', { length: 20 }),
  responsesCount: int('responses_count').default(0),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('assessments_org_idx').on(t.organizationId) }));

export const assessmentTargets = mysqlTable('assessment_targets', {
  assessmentId: fk('assessment_id').notNull(),
  targetId: fk('target_id').notNull(),
  targetRole: varchar('target_role', { length: 50 }),
}, t => ({ pk: primaryKey({ columns: [t.assessmentId, t.targetId] }) }));

export const assessmentResponses = mysqlTable('assessment_responses', {
  id: id(),
  assessmentId: fk('assessment_id').notNull(),
  respondentId: fk('respondent_id').notNull(),
  respondentRole: varchar('respondent_role', { length: 50 }).notNull(),
  // '' (empty string, not NULL — MySQL unique indexes treat each NULL as
  // distinct, which would silently defeat this constraint) for coach/mentor
  // responses, which have no pre/post phase concept; 'pre'/'post' for
  // beneficiary responses.
  phase: varchar('phase', { length: 10 }).notNull().default(''),
  organizationId: fk('organization_id'),
  answers: json('answers').$type<any>(),
  respondentInfo: json('respondent_info').$type<any>(),
  submittedAt: createdAt(),
}, t => ({
  uniq: uniqueIndex('assessment_responses_uniq').on(t.assessmentId, t.respondentId, t.respondentRole, t.phase),
}));

// ── Commerce ────────────────────────────────────────────────────────────

export const products = mysqlTable('products', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  category: varchar('category', { length: 100 }),
  image: text('image'),
  userId: fk('user_id'),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }),
  organizationId: fk('organization_id'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({
  userIdx: index('products_user_idx').on(t.userId),
  orgIdx: index('products_org_idx').on(t.organizationId),
}));

export const stores = mysqlTable('stores', {
  id: id(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  beneficiaryId: fk('beneficiary_id'),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }),
  organizationId: fk('organization_id'),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({ orgIdx: index('stores_org_idx').on(t.organizationId) }));

export const orders = mysqlTable('orders', {
  id: id(),
  type: mysqlEnum('type', ['product', 'session', 'subscription']).notNull(),
  userId: fk('user_id'),
  organizationId: fk('organization_id'),
  productId: fk('product_id'),
  courseId: fk('course_id'),
  planId: fk('plan_id'),
  planKey: varchar('plan_key', { length: 100 }),
  planName: varchar('plan_name', { length: 255 }),
  billingCycle: varchar('billing_cycle', { length: 20 }),
  currency: varchar('currency', { length: 10 }),
  productName: varchar('product_name', { length: 255 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0'),
  quantity: int('quantity').default(1),
  storeId: fk('store_id'),
  storeName: varchar('store_name', { length: 255 }),
  buyerName: varchar('buyer_name', { length: 255 }),
  buyerPhone: varchar('buyer_phone', { length: 50 }),
  buyerAddress: text('buyer_address'),
  notes: text('notes'),
  hostId: fk('host_id'),
  hostName: varchar('host_name', { length: 255 }),
  hostRole: varchar('host_role', { length: 50 }),
  preferredTime: varchar('preferred_time', { length: 255 }),
  paymentMethod: mysqlEnum('payment_method', ['cod', 'online']).default('cod'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('unpaid'),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  paymentId: varchar('payment_id', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: createdAt(),
}, t => ({
  userIdx: index('orders_user_idx').on(t.userId),
  orgIdx: index('orders_org_idx').on(t.organizationId),
  storeIdx: index('orders_store_idx').on(t.storeId),
  typeIdx: index('orders_type_idx').on(t.type),
}));

export const payouts = mysqlTable('payouts', {
  id: id(),
  userId: fk('user_id').notNull(),
  userName: varchar('user_name', { length: 255 }),
  userRole: varchar('user_role', { length: 50 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  grossAmount: decimal('gross_amount', { precision: 10, scale: 2 }),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }),
  orderIds: json('order_ids').$type<string[]>(),
  status: mysqlEnum('status', ['pending', 'paid', 'rejected']).default('pending').notNull(),
  paidAt: timestamp('paid_at'),
  transferReference: varchar('transfer_reference', { length: 255 }),
  notes: text('notes'),
  createdAt: createdAt(),
}, t => ({ userIdx: index('payouts_user_idx').on(t.userId) }));

// ── Community & comms ───────────────────────────────────────────────────

export const liveSessions = mysqlTable('live_sessions', {
  id: id(),
  coachId: fk('coach_id'),
  coachName: varchar('coach_name', { length: 255 }),
  organizationId: fk('organization_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  date: timestamp('date'),
  duration: varchar('duration', { length: 100 }),
  meetLink: text('meet_link'),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  maxParticipants: int('max_participants'),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('live_sessions_org_idx').on(t.organizationId) }));

export const liveSessionRegistrations = mysqlTable('live_session_registrations', {
  id: id(),
  sessionId: fk('session_id').notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'free', 'paid']).default('free'),
  registeredAt: createdAt(),
}, t => ({
  uniq: uniqueIndex('live_session_reg_uniq').on(t.sessionId, t.email),
}));

export const mentoringSessions = mysqlTable('sessions', {
  id: id(),
  title: varchar('title', { length: 255 }),
  date: timestamp('date'),
  status: varchar('status', { length: 20 }).default('pending'),
  hostId: fk('host_id'),
  organizationId: fk('organization_id'),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('sessions_org_idx').on(t.organizationId) }));

export const sessionAttendees = mysqlTable('session_attendees', {
  sessionId: fk('session_id').notNull(),
  userId: fk('user_id').notNull(),
}, t => ({ pk: primaryKey({ columns: [t.sessionId, t.userId] }) }));

export const projects = mysqlTable('projects', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  organizationId: fk('organization_id'),
  registrationForm: json('registration_form').$type<any>(),
  publishedAt: timestamp('published_at'),
  createdAt: createdAt(),
}, t => ({ orgIdx: index('projects_org_idx').on(t.organizationId) }));

export const projectRegistrations = mysqlTable('project_registrations', {
  id: id(),
  projectId: fk('project_id').notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  userId: fk('user_id'),
  answers: json('answers').$type<any>(),
  submittedAt: createdAt(),
}, t => ({ projectIdx: index('project_registrations_project_idx').on(t.projectId) }));

export const articles = mysqlTable('articles', {
  id: id(),
  title: varchar('title', { length: 255 }).notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  coverImageUrl: text('cover_image_url'),
  authorId: fk('author_id'),
  authorRole: varchar('author_role', { length: 50 }),
  authorName: varchar('author_name', { length: 255 }),
  authorAvatarUrl: text('author_avatar_url'),
  organizationId: fk('organization_id'),
  tags: json('tags').$type<string[]>(),
  readTime: varchar('read_time', { length: 50 }),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({ orgIdx: index('articles_org_idx').on(t.organizationId) }));

export const successStories = mysqlTable('success_stories', {
  id: id(),
  organizationId: fk('organization_id'),
  orgName: varchar('org_name', { length: 255 }),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }),
  beneficiaryRole: varchar('beneficiary_role', { length: 50 }),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  avatarUrl: text('avatar_url'),
  stars: tinyint('stars').default(5),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({ orgIdx: index('success_stories_org_idx').on(t.organizationId) }));

export const contentOffers = mysqlTable('content_offers', {
  id: id(),
  organizationId: fk('organization_id').notNull(),
  orgName: varchar('org_name', { length: 255 }),
  targetUid: fk('target_uid'),
  targetName: varchar('target_name', { length: 255 }),
  targetRole: varchar('target_role', { length: 50 }),
  offerType: varchar('offer_type', { length: 50 }),
  contentId: fk('content_id'),
  contentTitle: varchar('content_title', { length: 255 }),
  note: text('note'),
  status: mysqlEnum('status', ['pending', 'accepted', 'rejected']).default('pending').notNull(),
  createdAt: createdAt(),
});

export const socialContent = mysqlTable('social_content', {
  id: id(),
  beneficiaryId: fk('beneficiary_id').notNull(),
  title: varchar('title', { length: 255 }),
  type: varchar('type', { length: 50 }),
  mediaUrl: text('media_url'),
  mediaUrls: json('media_urls').$type<string[]>(),
  createdAt: createdAt(),
}, t => ({ beneficiaryIdx: index('social_content_beneficiary_idx').on(t.beneficiaryId) }));

export const mentorContracts = mysqlTable('mentor_contracts', {
  id: id(),
  mentorId: fk('mentor_id').notNull(),
  organizationId: fk('organization_id').notNull(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }),
  contractedHours: int('contracted_hours'),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({ uniq: uniqueIndex('mentor_contracts_uniq').on(t.mentorId, t.organizationId) }));

export const coachContracts = mysqlTable('coach_contracts', {
  id: id(),
  coachId: fk('coach_id').notNull(),
  organizationId: fk('organization_id').notNull(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }),
  contractedHours: int('contracted_hours'),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, t => ({ uniq: uniqueIndex('coach_contracts_uniq').on(t.coachId, t.organizationId) }));

export const notifications = mysqlTable('notifications', {
  id: id(),
  userId: fk('user_id').notNull(),
  type: varchar('type', { length: 50 }),
  title: varchar('title', { length: 255 }),
  body: text('body'),
  link: text('link'),
  read: boolean('read').default(false),
  createdAt: createdAt(),
}, t => ({ userIdx: index('notifications_user_idx').on(t.userId) }));

export const conversations = mysqlTable('conversations', {
  id: id(),
  lastMessage: text('last_message'),
  lastUpdated: timestamp('last_updated').defaultNow().onUpdateNow(),
  createdAt: createdAt(),
});

export const conversationParticipants = mysqlTable('conversation_participants', {
  conversationId: fk('conversation_id').notNull(),
  userId: fk('user_id').notNull(),
  unreadCount: int('unread_count').default(0),
}, t => ({
  pk: primaryKey({ columns: [t.conversationId, t.userId] }),
  userIdx: index('conversation_participants_user_idx').on(t.userId),
}));

export const messages = mysqlTable('messages', {
  id: id(),
  conversationId: fk('conversation_id').notNull(),
  senderId: fk('sender_id').notNull(),
  content: text('content'),
  read: boolean('read').default(false),
  createdAt: createdAt(),
}, t => ({ convIdx: index('messages_conv_idx').on(t.conversationId) }));

// ── Settings (replaces the handful of Firestore config/{id} singleton docs) ──

export const appSettings = mysqlTable('app_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: json('value').$type<any>(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
