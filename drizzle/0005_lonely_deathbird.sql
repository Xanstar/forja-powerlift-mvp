ALTER TABLE `programs` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `published_at` integer;--> statement-breakpoint
UPDATE `programs`
SET `status` = 'published', `published_at` = `created_at`
WHERE `activo` = 1;
