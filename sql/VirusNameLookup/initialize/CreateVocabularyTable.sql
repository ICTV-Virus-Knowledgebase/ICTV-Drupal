
CREATE TABLE IF NOT EXISTS `vocabulary` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `label` varchar(128) NOT NULL,
  `vocab_key` varchar(128) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UK_vocab_label` (`label`) USING BTREE,
  UNIQUE KEY `UK_vocab_key` (`vocab_key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;