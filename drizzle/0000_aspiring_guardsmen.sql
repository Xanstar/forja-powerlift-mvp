CREATE TABLE `athletes` (
	`id` text PRIMARY KEY NOT NULL,
	`coach_id` text NOT NULL,
	`nombre` text NOT NULL,
	`apellido` text NOT NULL,
	`foto_url` text,
	`fecha_nacimiento` integer,
	`peso_corporal` real,
	`altura` real,
	`categoria` text,
	`sexo` text,
	`fecha_ingreso` integer DEFAULT (unixepoch()) NOT NULL,
	`estado` text DEFAULT 'activo' NOT NULL,
	`notas` text,
	`access_pin` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `coaches` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coaches_email_unique` ON `coaches` (`email`);--> statement-breakpoint
CREATE TABLE `day_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`completado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `days` (
	`id` text PRIMARY KEY NOT NULL,
	`week_id` text NOT NULL,
	`nombre` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`fecha` integer,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`nombre` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`descanso` text,
	`observaciones` text,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planned_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`numero_set` integer NOT NULL,
	`repeticiones_objetivo` integer NOT NULL,
	`peso_tipo` text DEFAULT 'absoluto' NOT NULL,
	`peso_kg` real,
	`porcentaje_rm` real,
	`rpe_objetivo` real,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`athlete_id`) REFERENCES `athletes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`lift` text NOT NULL,
	`valor_kg` real NOT NULL,
	`tipo` text DEFAULT 'estimado' NOT NULL,
	`fecha` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`athlete_id`) REFERENCES `athletes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `set_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_set_id` text NOT NULL,
	`peso_kg_real` real,
	`repeticiones_reales` integer,
	`rpe_real` real,
	`comentario` text,
	`completado_en` integer,
	FOREIGN KEY (`planned_set_id`) REFERENCES `planned_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`numero` integer NOT NULL,
	`etiqueta` text,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
