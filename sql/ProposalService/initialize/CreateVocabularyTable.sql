
DROP TABLE IF EXISTS `vocabulary`;

CREATE TABLE `vocabulary` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`description` VARCHAR(256) NULL DEFAULT NULL,
	`label` VARCHAR(128) NOT NULL,
	`vocab_key` VARCHAR(128) NOT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `UK_vocab_label` (`label`) USING BTREE,
	UNIQUE INDEX `UK_vocab_key` (`vocab_key`) USING BTREE
);
