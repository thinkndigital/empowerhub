CREATE TABLE `app_settings` (
	`key` varchar(100) NOT NULL,
	`value` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text,
	`cover_image_url` text,
	`author_id` varchar(36),
	`author_role` varchar(50),
	`author_name` varchar(255),
	`author_avatar_url` text,
	`organization_id` varchar(36),
	`tags` json,
	`read_time` varchar(50),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_responses` (
	`id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`respondent_id` varchar(36) NOT NULL,
	`respondent_role` varchar(50) NOT NULL,
	`organization_id` varchar(36),
	`answers` json,
	`respondent_info` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessment_responses_uniq` UNIQUE(`assessment_id`,`respondent_id`,`respondent_role`)
);
--> statement-breakpoint
CREATE TABLE `assessment_targets` (
	`assessment_id` varchar(36) NOT NULL,
	`target_id` varchar(36) NOT NULL,
	`target_role` varchar(50),
	CONSTRAINT `assessment_targets_assessment_id_target_id_pk` PRIMARY KEY(`assessment_id`,`target_id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(50),
	`questions` json,
	`status` enum('draft','sent','closed') NOT NULL DEFAULT 'draft',
	`organization_id` varchar(36),
	`created_by` varchar(36),
	`org_name` varchar(255),
	`org_logo` text,
	`org_color` varchar(20),
	`responses_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_contracts` (
	`id` varchar(36) NOT NULL,
	`coach_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`hourly_rate` decimal(10,2),
	`currency` varchar(10),
	`contracted_hours` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `coach_contracts_uniq` UNIQUE(`coach_id`,`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `content_offers` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`org_name` varchar(255),
	`target_uid` varchar(36),
	`target_name` varchar(255),
	`target_role` varchar(50),
	`offer_type` varchar(50),
	`content_id` varchar(36),
	`content_title` varchar(255),
	`note` text,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`conversation_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`unread_count` int DEFAULT 0,
	CONSTRAINT `conversation_participants_conversation_id_user_id_pk` PRIMARY KEY(`conversation_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(36) NOT NULL,
	`last_message` text,
	`last_updated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`title` varchar(255),
	`content` text,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`level` varchar(50),
	`language` varchar(50),
	`price` decimal(10,2) DEFAULT '0',
	`duration` varchar(100),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`cover_image_url` text,
	`coach_name` varchar(255),
	`created_by` varchar(36),
	`organization_id` varchar(36),
	`enrolled_count` int DEFAULT 0,
	`completion_rate` int DEFAULT 0,
	`objectives` json,
	`requirements` json,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`progress` int DEFAULT 0,
	`assigned` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`enrolled_by` varchar(36),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollments_course_user_uniq` UNIQUE(`course_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`group_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `group_members_group_id_user_id_pk` PRIMARY KEY(`group_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_session_registrations` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`phone` varchar(50),
	`payment_status` enum('pending','free','paid') DEFAULT 'free',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_session_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `live_session_reg_uniq` UNIQUE(`session_id`,`email`)
);
--> statement-breakpoint
CREATE TABLE `live_sessions` (
	`id` varchar(36) NOT NULL,
	`coach_id` varchar(36),
	`coach_name` varchar(255),
	`organization_id` varchar(36),
	`title` varchar(255) NOT NULL,
	`description` text,
	`cover_image_url` text,
	`date` timestamp,
	`duration` varchar(100),
	`meet_link` text,
	`price` decimal(10,2) DEFAULT '0',
	`max_participants` int,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_contracts` (
	`id` varchar(36) NOT NULL,
	`mentor_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`hourly_rate` decimal(10,2),
	`currency` varchar(10),
	`contracted_hours` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentor_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `mentor_contracts_uniq` UNIQUE(`mentor_id`,`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255),
	`date` timestamp,
	`status` varchar(20) DEFAULT 'pending',
	`host_id` varchar(36),
	`organization_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`content` text,
	`read` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` varchar(50),
	`title` varchar(255),
	`body` text,
	`link` text,
	`read` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`type` enum('product','session','subscription') NOT NULL,
	`user_id` varchar(36),
	`organization_id` varchar(36),
	`product_id` varchar(36),
	`course_id` varchar(36),
	`plan_id` varchar(36),
	`plan_key` varchar(100),
	`plan_name` varchar(255),
	`billing_cycle` varchar(20),
	`currency` varchar(10),
	`product_name` varchar(255),
	`total_amount` decimal(10,2) DEFAULT '0',
	`quantity` int DEFAULT 1,
	`store_id` varchar(36),
	`store_name` varchar(255),
	`buyer_name` varchar(255),
	`buyer_phone` varchar(50),
	`buyer_address` text,
	`notes` text,
	`host_id` varchar(36),
	`host_name` varchar(255),
	`host_role` varchar(50),
	`preferred_time` varchar(255),
	`payment_method` enum('cod','online') DEFAULT 'cod',
	`payment_status` varchar(20) DEFAULT 'unpaid',
	`payment_gateway` varchar(50),
	`payment_id` varchar(255),
	`status` varchar(20) DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_invitations` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`org_name` varchar(255),
	`target_uid` varchar(36),
	`target_name` varchar(255),
	`target_role` varchar(50),
	`group_name` varchar(255),
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`admin_id` varchar(36),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`plan_key` varchar(100),
	`invite_code` varchar(16),
	`primary_color` varchar(20),
	`logo_url` text,
	`max_users_override` int,
	`max_mentors_override` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_invite_code_unique` UNIQUE(`invite_code`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`user_name` varchar(255),
	`user_role` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`gross_amount` decimal(10,2),
	`commission_amount` decimal(10,2),
	`order_ids` json,
	`status` enum('pending','paid','rejected') NOT NULL DEFAULT 'pending',
	`paid_at` timestamp,
	`transfer_reference` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price_monthly` decimal(10,2),
	`price_annual` decimal(10,2),
	`currency` varchar(10) DEFAULT 'JOD',
	`sort_order` int DEFAULT 0,
	`max_users` int,
	`max_mentors` int,
	`features` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) DEFAULT '0',
	`category` varchar(100),
	`image` text,
	`user_id` varchar(36),
	`beneficiary_name` varchar(255),
	`organization_id` varchar(36),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_registrations` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`user_id` varchar(36),
	`answers` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`organization_id` varchar(36),
	`registration_form` json,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_attendees` (
	`session_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `session_attendees_session_id_user_id_pk` PRIMARY KEY(`session_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `social_content` (
	`id` varchar(36) NOT NULL,
	`beneficiary_id` varchar(36) NOT NULL,
	`title` varchar(255),
	`type` varchar(50),
	`media_url` text,
	`media_urls` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`beneficiary_id` varchar(36),
	`beneficiary_name` varchar(255),
	`organization_id` varchar(36),
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`organization_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`plan_key` varchar(100),
	`plan_name` varchar(255),
	`billing_cycle` enum('monthly','annual'),
	`status` enum('pending','trial','active','expired','cancelled') NOT NULL DEFAULT 'pending',
	`price` decimal(10,2),
	`start_date` timestamp,
	`end_date` timestamp,
	`permanent_free` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptions_organization_id` PRIMARY KEY(`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `success_stories` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36),
	`org_name` varchar(255),
	`beneficiary_name` varchar(255),
	`beneficiary_role` varchar(50),
	`title` varchar(255),
	`content` text,
	`avatar_url` text,
	`stars` tinyint DEFAULT 5,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `success_stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_blocks` (
	`blocker_id` varchar(36) NOT NULL,
	`blocked_id` varchar(36) NOT NULL,
	CONSTRAINT `user_blocks_blocker_id_blocked_id_pk` PRIMARY KEY(`blocker_id`,`blocked_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','organization','mentor','coach','beneficiary','merchant','merchant_staff') NOT NULL,
	`organization_id` varchar(36),
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`progress` int DEFAULT 0,
	`mentor_id` varchar(36),
	`coach_id` varchar(36),
	`group_id` varchar(36),
	`category` varchar(255),
	`expertise` varchar(255),
	`avatar_url` text,
	`display_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `articles_org_idx` ON `articles` (`organization_id`);--> statement-breakpoint
CREATE INDEX `assessments_org_idx` ON `assessments` (`organization_id`);--> statement-breakpoint
CREATE INDEX `conversation_participants_user_idx` ON `conversation_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `course_lessons_course_idx` ON `course_lessons` (`course_id`);--> statement-breakpoint
CREATE INDEX `courses_org_idx` ON `courses` (`organization_id`);--> statement-breakpoint
CREATE INDEX `courses_creator_idx` ON `courses` (`created_by`);--> statement-breakpoint
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`user_id`);--> statement-breakpoint
CREATE INDEX `groups_org_idx` ON `groups` (`organization_id`);--> statement-breakpoint
CREATE INDEX `live_sessions_org_idx` ON `live_sessions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `sessions_org_idx` ON `sessions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `messages_conv_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_org_idx` ON `orders` (`organization_id`);--> statement-breakpoint
CREATE INDEX `orders_store_idx` ON `orders` (`store_id`);--> statement-breakpoint
CREATE INDEX `orders_type_idx` ON `orders` (`type`);--> statement-breakpoint
CREATE INDEX `org_invitations_org_idx` ON `org_invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `payouts_user_idx` ON `payouts` (`user_id`);--> statement-breakpoint
CREATE INDEX `products_user_idx` ON `products` (`user_id`);--> statement-breakpoint
CREATE INDEX `products_org_idx` ON `products` (`organization_id`);--> statement-breakpoint
CREATE INDEX `project_registrations_project_idx` ON `project_registrations` (`project_id`);--> statement-breakpoint
CREATE INDEX `projects_org_idx` ON `projects` (`organization_id`);--> statement-breakpoint
CREATE INDEX `social_content_beneficiary_idx` ON `social_content` (`beneficiary_id`);--> statement-breakpoint
CREATE INDEX `stores_org_idx` ON `stores` (`organization_id`);--> statement-breakpoint
CREATE INDEX `success_stories_org_idx` ON `success_stories` (`organization_id`);--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`organization_id`);--> statement-breakpoint
CREATE INDEX `users_mentor_idx` ON `users` (`mentor_id`);--> statement-breakpoint
CREATE INDEX `users_coach_idx` ON `users` (`coach_id`);