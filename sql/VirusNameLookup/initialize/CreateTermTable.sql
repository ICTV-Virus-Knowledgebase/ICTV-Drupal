
CREATE TABLE IF NOT EXISTS `term` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `full_key` varchar(256) NOT NULL,
  `label` varchar(128) NOT NULL,
  `term_key` varchar(128) NOT NULL,
  `vocab_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UK_term_full_key` (`full_key`) USING BTREE,
  KEY `FK_vocabulary` (`vocab_id`) USING BTREE,
  KEY `term_term_key_IDX` (`term_key`) USING BTREE,
  CONSTRAINT `FK_term_vocabulary` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;