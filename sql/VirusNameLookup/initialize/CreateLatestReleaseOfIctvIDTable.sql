
CREATE TABLE `latest_release_of_ictv_id` (
  `ictv_id` int(10) unsigned NOT NULL,
  `latest_msl_release` int(10) unsigned NOT NULL,
  PRIMARY KEY (`ictv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='A table that associates every ictv ID with the latest release in which it appears.';