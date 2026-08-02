CREATE TABLE `day_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`source_program_id` text NOT NULL,
	`source_day_id` text NOT NULL,
	`program_name` text NOT NULL,
	`week_number` integer NOT NULL,
	`day_name` text NOT NULL,
	`completed_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_executions_source_day_id_unique` ON `day_executions` (`source_day_id`);--> statement-breakpoint
CREATE TABLE `execution_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`source_program_id` text NOT NULL,
	`source_day_id` text NOT NULL,
	`source_planned_set_id` text NOT NULL,
	`client_mutation_id` text NOT NULL,
	`program_name` text NOT NULL,
	`week_number` integer NOT NULL,
	`day_name` text NOT NULL,
	`exercise_name` text NOT NULL,
	`set_number` integer NOT NULL,
	`target_reps` integer NOT NULL,
	`target_rpe` real,
	`prescription_type` text NOT NULL,
	`prescribed_weight_kg` real,
	`percentage_rm` real,
	`source_one_rm_kg` real,
	`status` text NOT NULL,
	`skip_reason` text,
	`actual_weight_kg` real,
	`actual_reps` integer,
	`actual_rpe` real,
	`comment` text,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `execution_sets_source_planned_set_id_unique` ON `execution_sets` (`source_planned_set_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `execution_sets_client_mutation_id_unique` ON `execution_sets` (`client_mutation_id`);--> statement-breakpoint
INSERT INTO `execution_sets` (
	`id`, `athlete_id`, `source_program_id`, `source_day_id`,
	`source_planned_set_id`, `client_mutation_id`, `program_name`,
	`week_number`, `day_name`, `exercise_name`, `set_number`, `target_reps`,
	`target_rpe`, `prescription_type`, `prescribed_weight_kg`, `percentage_rm`,
	`status`, `actual_weight_kg`, `actual_reps`, `actual_rpe`, `comment`, `recorded_at`
)
SELECT
	lower(hex(randomblob(16))), p.athlete_id, p.id, d.id,
	ps.id, 'legacy-' || sl.id, p.nombre, w.numero, d.nombre, e.nombre,
	ps.numero_set, ps.repeticiones_objetivo, ps.rpe_objetivo, ps.peso_tipo,
	ps.peso_kg, ps.porcentaje_rm, 'completed', sl.peso_kg_real,
	sl.repeticiones_reales, sl.rpe_real, sl.comentario,
	coalesce(sl.completado_en, unixepoch())
FROM set_logs sl
JOIN planned_sets ps ON ps.id = sl.planned_set_id
JOIN exercises e ON e.id = ps.exercise_id
JOIN days d ON d.id = e.day_id
JOIN weeks w ON w.id = d.week_id
JOIN programs p ON p.id = w.program_id
WHERE sl.id = (
	SELECT latest.id FROM set_logs latest
	WHERE latest.planned_set_id = sl.planned_set_id
	ORDER BY latest.completado_en DESC, latest.id DESC LIMIT 1
);--> statement-breakpoint
INSERT INTO `day_executions` (
	`id`, `athlete_id`, `source_program_id`, `source_day_id`,
	`program_name`, `week_number`, `day_name`, `completed_at`
)
SELECT
	lower(hex(randomblob(16))), p.athlete_id, p.id, d.id,
	p.nombre, w.numero, d.nombre, max(dc.completado_en)
FROM day_completions dc
JOIN days d ON d.id = dc.day_id
JOIN weeks w ON w.id = d.week_id
JOIN programs p ON p.id = w.program_id
GROUP BY d.id;
