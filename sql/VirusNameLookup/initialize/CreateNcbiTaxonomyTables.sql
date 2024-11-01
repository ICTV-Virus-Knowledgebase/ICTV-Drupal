
-- Create the NCBI Taxonomy tables

CREATE TABLE `ncbi_division` (
	`id` TINYINT(4) NOT NULL,
	`cde` VARCHAR(10) NOT NULL COLLATE 'utf8mb4_general_ci',
	`name` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_general_ci',
	`comments` VARCHAR(60) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`tid` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the division name.',
	PRIMARY KEY (`id`) USING BTREE
);


CREATE TABLE `ncbi_name` (
	`tax_id` MEDIUMINT(9) NOT NULL,
	`name_txt` VARCHAR(500) NOT NULL COLLATE 'utf8mb4_general_ci',
	`unique_name` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`name_class` VARCHAR(20) NOT NULL COLLATE 'utf8mb4_general_ci',
	`name_class_tid` INT(11) NULL DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the name class.',
	PRIMARY KEY (`tax_id`, `name_txt`, `name_class`) USING BTREE
);


CREATE TABLE `ncbi_node` (
	`tax_id` MEDIUMINT(9) NOT NULL,
	`parent_tax_id` MEDIUMINT(9) NOT NULL,
	`rank_name` VARCHAR(20) NOT NULL COLLATE 'utf8mb4_general_ci',
	`rank_name_tid` INT(11) NULL DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the rank name.',
	`embl_code` VARCHAR(10) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`division_id` TINYINT(4) NULL DEFAULT NULL,
   `ictv_taxnode_id` MEDIUMINT(9) NULL COMMENT 'The latest version of an ICTV taxon with the same name',
	`inherited_div_flag` TINYINT(4) NULL DEFAULT NULL,
	`genetic_code_id` TINYINT(4) NULL DEFAULT NULL,
	`inherited_gc_flag` TINYINT(4) NULL DEFAULT NULL,
	`mitochondrial_genetic_code_id` TINYINT(4) NULL DEFAULT NULL,
	`inherited_mgc_flag` TINYINT(4) NULL DEFAULT NULL,
	`genbank_hidden_flag` TINYINT(4) NULL DEFAULT NULL,
	`hidden_subtree_root_flag` TINYINT(4) NULL DEFAULT NULL,
	`comments` VARCHAR(60) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
   `subspecies_parent_tax_id` INT(11) NULL COMMENT 'The lowest parent taxon (species or higher) of a subspecies node',
	PRIMARY KEY (`tax_id`) USING BTREE,
	INDEX `FK_division_id` (`division_id`) USING BTREE,
	INDEX `FK_parent_tax_id_tax_id` (`parent_tax_id`) USING BTREE,
	CONSTRAINT `FK_division_id` FOREIGN KEY (`division_id`) REFERENCES `ncbi_division` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `FK_parent_tax_id_tax_id` FOREIGN KEY (`parent_tax_id`) REFERENCES `ncbi_node` (`tax_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

