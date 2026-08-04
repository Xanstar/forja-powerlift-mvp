ALTER TABLE `day_executions` ADD `client_mutation_id` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `day_executions_client_mutation_id_unique` ON `day_executions` (`client_mutation_id`);
--> statement-breakpoint
CREATE TABLE `day_completion_legacy_duplicates` (
	`original_id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`completado_en` integer,
	`canonical_id` text NOT NULL,
	`archived_at` integer NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `day_completion_legacy_duplicates`
  (`original_id`, `day_id`, `completado_en`, `canonical_id`, `archived_at`, `reason`)
WITH ranked AS (
  SELECT
    dc.`id`,
    dc.`day_id`,
    dc.`completado_en`,
    FIRST_VALUE(dc.`id`) OVER (
      PARTITION BY dc.`day_id`
      ORDER BY
        CASE WHEN EXISTS (
          SELECT 1 FROM `day_executions` de
          WHERE de.`source_day_id` = dc.`day_id`
            AND (
              de.`completed_at` = dc.`completado_en`
              OR de.`completed_at` = dc.`completado_en` * 1000
              OR de.`completed_at` * 1000 = dc.`completado_en`
            )
        ) THEN 0 ELSE 1 END,
        CASE WHEN dc.`completado_en` IS NULL THEN 1 ELSE 0 END,
        dc.`completado_en` DESC,
        dc.`id` DESC
    ) AS canonical_id,
    ROW_NUMBER() OVER (
      PARTITION BY dc.`day_id`
      ORDER BY
        CASE WHEN EXISTS (
          SELECT 1 FROM `day_executions` de
          WHERE de.`source_day_id` = dc.`day_id`
            AND (
              de.`completed_at` = dc.`completado_en`
              OR de.`completed_at` = dc.`completado_en` * 1000
              OR de.`completed_at` * 1000 = dc.`completado_en`
            )
        ) THEN 0 ELSE 1 END,
        CASE WHEN dc.`completado_en` IS NULL THEN 1 ELSE 0 END,
        dc.`completado_en` DESC,
        dc.`id` DESC
    ) AS rank_in_day
  FROM `day_completions` dc
)
SELECT
  `id`,
  `day_id`,
  `completado_en`,
  `canonical_id`,
  unixepoch(),
  'duplicate_day_completion_before_unique_index'
FROM ranked
WHERE rank_in_day > 1;
--> statement-breakpoint
DELETE FROM `day_completions`
WHERE `id` IN (SELECT `original_id` FROM `day_completion_legacy_duplicates`);
--> statement-breakpoint
CREATE TABLE `__new_day_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`completado_en` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_day_completions` (`id`, `day_id`, `completado_en`)
SELECT `id`, `day_id`, `completado_en` FROM `day_completions`;
--> statement-breakpoint
DROP TABLE `day_completions`;
--> statement-breakpoint
ALTER TABLE `__new_day_completions` RENAME TO `day_completions`;
--> statement-breakpoint
CREATE UNIQUE INDEX `day_completions_day_id_unique` ON `day_completions` (`day_id`);
--> statement-breakpoint
CREATE TRIGGER `day_execution_operation_not_used_by_set_insert`
BEFORE INSERT ON `day_executions`
WHEN NEW.`client_mutation_id` IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM `execution_sets`
    WHERE `client_mutation_id` = NEW.`client_mutation_id`
  )
BEGIN
  SELECT RAISE(ABORT, 'client_mutation_id_reused');
END;
--> statement-breakpoint
CREATE TRIGGER `day_execution_operation_not_used_by_set_update`
BEFORE UPDATE OF `client_mutation_id` ON `day_executions`
WHEN NEW.`client_mutation_id` IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM `execution_sets`
    WHERE `client_mutation_id` = NEW.`client_mutation_id`
  )
BEGIN
  SELECT RAISE(ABORT, 'client_mutation_id_reused');
END;
--> statement-breakpoint
CREATE TRIGGER `set_operation_not_used_by_day_insert`
BEFORE INSERT ON `execution_sets`
WHEN EXISTS (
  SELECT 1 FROM `day_executions`
  WHERE `client_mutation_id` = NEW.`client_mutation_id`
)
BEGIN
  SELECT RAISE(ABORT, 'client_mutation_id_reused');
END;
--> statement-breakpoint
CREATE TRIGGER `set_operation_not_used_by_day_update`
BEFORE UPDATE OF `client_mutation_id` ON `execution_sets`
WHEN EXISTS (
  SELECT 1 FROM `day_executions`
  WHERE `client_mutation_id` = NEW.`client_mutation_id`
)
BEGIN
  SELECT RAISE(ABORT, 'client_mutation_id_reused');
END;
