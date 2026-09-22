CREATE TABLE `action_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('immediate','preparation','avoidance','escalation') NOT NULL,
	`priority` enum('now','next','ready') NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`supportingEvidence` text NOT NULL,
	`source` varchar(180) NOT NULL,
	`evidenceCategory` enum('verified','supported','unverified','conflicting','unknown') NOT NULL,
	`confidence` int NOT NULL,
	`uncertainty` text NOT NULL,
	CONSTRAINT `action_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_graph_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromType` varchar(80) NOT NULL,
	`fromLabel` varchar(220) NOT NULL,
	`toType` varchar(80) NOT NULL,
	`toLabel` varchar(220) NOT NULL,
	`relationship` varchar(120) NOT NULL,
	`evidenceCategory` enum('verified','supported','unverified','conflicting','unknown') NOT NULL,
	`relevance` int NOT NULL,
	`confidence` int NOT NULL,
	`uncertainty` text NOT NULL,
	CONSTRAINT `evidence_graph_links_id` PRIMARY KEY(`id`)
);
