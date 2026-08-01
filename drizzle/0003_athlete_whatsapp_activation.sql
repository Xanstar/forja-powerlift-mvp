CREATE TABLE `athlete_activation_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`sent_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`athlete_id`) REFERENCES `athletes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_activation_challenges_athlete_id_unique` ON `athlete_activation_challenges` (`athlete_id`);--> statement-breakpoint
ALTER TABLE `athletes` ADD `telefono_e164` text;--> statement-breakpoint
ALTER TABLE `athletes` ADD `telefono_verificado_at` integer;--> statement-breakpoint
ALTER TABLE `athletes` ADD `invitacion_enviada_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `athletes_telefono_e164_unique` ON `athletes` (`telefono_e164`);