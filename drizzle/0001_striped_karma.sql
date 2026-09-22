CREATE TABLE `action_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`stepOrder` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('now','next','ready') NOT NULL,
	`status` enum('pending','in_progress','complete') NOT NULL DEFAULT 'pending',
	`dueBy` varchar(120),
	CONSTRAINT `action_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `citizen_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationName` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` enum('low','moderate','high','severe') NOT NULL,
	`summary` text NOT NULL,
	`verificationStatus` enum('unverified','triaged','corroborated') NOT NULL DEFAULT 'unverified',
	`reportedAt` timestamp NOT NULL,
	`upvotes` int NOT NULL DEFAULT 0,
	CONSTRAINT `citizen_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warningId` int,
	`sourceId` int,
	`evidenceType` varchar(100) NOT NULL,
	`title` varchar(220) NOT NULL,
	`publisher` varchar(180) NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`url` text,
	`confidence` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	CONSTRAINT `evidence_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`district` varchar(140) NOT NULL,
	`latitude` varchar(24) NOT NULL,
	`longitude` varchar(24) NOT NULL,
	`riskBand` enum('low','moderate','high','severe') NOT NULL,
	`description` text,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safety_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`state` enum('safe','needs_check_in','assistance_requested','unknown') NOT NULL,
	`lastCheckIn` timestamp,
	`message` text NOT NULL,
	`nextCheckIn` varchar(120),
	CONSTRAINT `safety_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shelters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(24) NOT NULL,
	`longitude` varchar(24) NOT NULL,
	`capacity` int NOT NULL,
	`availableSpaces` int NOT NULL,
	`status` enum('open','limited','closed') NOT NULL DEFAULT 'open',
	CONSTRAINT `shelters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`displayName` varchar(140) NOT NULL,
	`homeArea` varchar(180) NOT NULL,
	`householdSize` int NOT NULL DEFAULT 1,
	`mobilityNeeds` varchar(180),
	`preferredLanguage` varchar(80) NOT NULL DEFAULT 'English',
	`emergencyContact` varchar(180),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warning_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`agency` varchar(160) NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`trustLevel` enum('official','partner','community') NOT NULL DEFAULT 'official',
	`url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warning_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`hazardType` varchar(80) NOT NULL,
	`severity` enum('advisory','watch','warning','critical') NOT NULL,
	`status` enum('active','monitoring','expired') NOT NULL DEFAULT 'active',
	`area` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`validUntil` timestamp,
	`sourceLabel` varchar(180) NOT NULL,
	CONSTRAINT `warnings_id` PRIMARY KEY(`id`)
);
