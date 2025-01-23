
CREATE TABLE IF NOT EXISTS `latest_release_of_ictv_id` (
  `ictv_id` int(10) unsigned NOT NULL,
  `latest_msl_release` int(10) unsigned NOT NULL,
  PRIMARY KEY (`ictv_id`),
  KEY `idx_latest_release_ictv_id_msl_release` (`ictv_id`,`latest_msl_release`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='A table that associates every ictv ID with the latest release in which it appears.';