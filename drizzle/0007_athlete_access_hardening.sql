CREATE TABLE `access_rate_limits` (
	`scope` text NOT NULL,
	`key_hash` text NOT NULL,
	`window_start_ms` integer NOT NULL,
	`attempt_count` integer NOT NULL,
	`locked_until_ms` integer,
	`updated_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `key_hash`)
);
--> statement-breakpoint
CREATE INDEX `access_rate_limits_updated_idx` ON `access_rate_limits` (`updated_at_ms`);--> statement-breakpoint
CREATE TABLE `athlete_access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`credential_version` integer NOT NULL,
	`issued_at` integer NOT NULL,
	`rotated_at` integer,
	`revoked_at` integer,
	FOREIGN KEY (`athlete_id`) REFERENCES `athletes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_access_tokens_athlete_id_unique` ON `athlete_access_tokens` (`athlete_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_access_tokens_token_hash_unique` ON `athlete_access_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `athlete_access_tokens_active_idx` ON `athlete_access_tokens` (`revoked_at`);--> statement-breakpoint
ALTER TABLE `athletes` ADD `credential_version` integer DEFAULT 0 NOT NULL;