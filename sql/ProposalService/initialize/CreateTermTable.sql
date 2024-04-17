
DROP TABLE IF EXISTS `term`;

CREATE TABLE `term` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`description` VARCHAR(256) NULL DEFAULT NULL,
	`full_key` VARCHAR(256) NOT NULL,
	`label` VARCHAR(128) NOT NULL,
	`term_key` VARCHAR(128) NOT NULL,
	`vocab_id` INT(10) UNSIGNED NOT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `UK_term_full_key` (`full_key`) USING BTREE,
	INDEX `FK_vocabulary` (`vocab_id`) USING BTREE,
	CONSTRAINT `FK_term_vocabulary` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) 
      ON UPDATE NO ACTION ON DELETE NO ACTION
);
