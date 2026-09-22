ALTER TABLE `warnings` ADD `alertId` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `warnings` ADD `sourceStatus` enum('official','connected','simulated') DEFAULT 'simulated' NOT NULL;--> statement-breakpoint
ALTER TABLE `warnings` ADD `warningText` text NOT NULL;--> statement-breakpoint
ALTER TABLE `warnings` ADD `recommendedPrecautions` text NOT NULL;--> statement-breakpoint
ALTER TABLE `warnings` ADD `validFrom` timestamp NOT NULL;