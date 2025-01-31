
CREATE TABLE `curated_name` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `division_tid` int(10) unsigned DEFAULT NULL,
  `ictv_id` int(10) unsigned DEFAULT NULL,
  `ictv_taxnode_id` int(10) unsigned DEFAULT NULL,
  `is_valid` bit(1) DEFAULT NULL,
  `name` varchar(300) NOT NULL,
  `name_class_tid` int(10) unsigned DEFAULT NULL,
  `rank_name_tid` int(10) unsigned DEFAULT NULL,
  `taxonomy_db_tid` int(10) unsigned DEFAULT NULL,
  `taxonomy_id` int(10) unsigned DEFAULT NULL,
  `version_id` int(10) unsigned DEFAULT NULL,
  `created_by` varchar(100) NOT NULL,
  `created_on` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;