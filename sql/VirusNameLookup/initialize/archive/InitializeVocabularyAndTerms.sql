
DELIMITER //

DROP PROCEDURE IF EXISTS `initializeVocabularyAndTerms`;

CREATE PROCEDURE `initializeVocabularyAndTerms`()
   MODIFIES SQL DATA
BEGIN

   DECLARE vocabID INT;

   -- Create the vocabulary table if it doesn't already exist.
   CREATE TABLE IF NOT EXISTS `vocabulary` (
      `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      `description` VARCHAR(256) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
      `label` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
      `vocab_key` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
      PRIMARY KEY (`id`) USING BTREE,
      UNIQUE INDEX `UK_vocab_label` (`label`) USING BTREE,
      UNIQUE INDEX `UK_vocab_key` (`vocab_key`) USING BTREE
   );

   -- Create the term table if it doesn't already exist.
   CREATE TABLE IF NOT EXISTS `term` (
      `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      `description` VARCHAR(256) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
      `full_key` VARCHAR(256) NOT NULL COLLATE 'utf8mb4_general_ci',
      `label` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
      `term_key` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
      `vocab_id` INT(10) UNSIGNED NOT NULL,
      PRIMARY KEY (`id`) USING BTREE,
      UNIQUE INDEX `UK_term_full_key` (`full_key`) USING BTREE,
      INDEX `FK_vocabulary` (`vocab_id`) USING BTREE,
      CONSTRAINT `FK_term_vocabulary` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
   );


   /*
   The name_class vocabulary
   */
   INSERT IGNORE INTO `vocabulary` SET label = 'name class', vocab_key = 'name_class';
   
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for name_class';
   END IF;

   -- Insert terms for name_class.
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.acronym', 'acronym', 'acronym', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.blast_name', 'BLAST name', 'blast_name', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.common_name', 'common name', 'common_name', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.equivalent_name', 'equivalent name', 'equivalent_name', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.genbank_acronym', 'GenBank acronym', 'genbank_acronym', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.genbank_common_name', 'GenBank common name', 'genbank_common_name', vocabID);
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.in_part', 'in-part', 'in_part', vocabID);
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.includes', 'includes', 'includes', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.scientific_name', 'scientific name', 'scientific_name', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.synonym', 'synonym', 'synonym', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.isolate_name', 'isolate name', 'isolate_name', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.isolate_abbreviation', 'isolate abbreviation', 'isolate_abbreviation', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.isolate_designation', 'isolate designation', 'isolate_designation', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.genbank_accession', 'GenBank accession', 'genbank_accession', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.refseq_accession', 'Refseq accession', 'refseq_accession', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.refseq_organism', 'Refseq organism', 'refseq_organism', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.abbreviation', 'abbreviation', 'abbreviation', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.isolate_exemplar', 'isolate exemplar', 'isolate_exemplar', vocabID);


   /*
   The ncbi_division vocabulary
   */
   INSERT IGNORE INTO `vocabulary` SET label = 'NCBI Division', vocab_key = 'ncbi_division';

   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for ncbi_division';
   END IF;

   -- Insert terms for NCBI division.
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.bacteria', 'Bacteria', 'bacteria', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.environmental_samples', 'Environmental samples', 'environmental_samples', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.invertebrates', 'Invertebrates', 'invertebrates', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.mammals', 'Mammals', 'mammals', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.phages', 'Phages', 'phages', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.plants_and_fungi', 'Plants and Fungi', 'plants_and_fungi', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.primates', 'Primates', 'primates', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.rodents', 'Rodents', 'rodents', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.synthetic_and_chimeric', 'Synthetic and Chimeric', 'synthetic_and_chimeric', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.unassigned', 'Unassigned', 'unassigned', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.vertebrates', 'Vertebrates', 'vertebrates', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('ncbi_division.viruses', 'Viruses', 'viruses', vocabID);

   /*
   The taxonomy_db vocabulary
   */
   INSERT IGNORE INTO `vocabulary` SET label = 'taxonomy DB', vocab_key = 'taxonomy_db';

   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_db' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for taxonomy_db';
   END IF;

   -- Insert terms for taxonomy DB.
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.ictv_taxonomy', 'ICTV Taxonomy', 'ictv_taxonomy', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.ictv_vmr', 'ICTV VMR', 'ictv_vmr', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.ncbi_taxonomy', 'NCBI Taxonomy', 'ncbi_taxonomy', vocabID);

   /*
   The taxonomy_rank vocabulary
   */
   INSERT IGNORE INTO `vocabulary` SET label = 'taxonomy rank', vocab_key = 'taxonomy_rank';

   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_rank' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for taxonomy_rank';
   END IF;

   -- Insert terms for taxonomy rank.
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.biotype', 'biotype', 'biotype', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.clade', 'clade', 'clade', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.class', 'class', 'class', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.cohort', 'cohort', 'cohort', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.family', 'family', 'family', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.forma', 'forma', 'forma', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.forma_specialis', 'forma specialis', 'forma_specialis', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.genotype', 'genotype', 'genotype', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.genus', 'genus', 'genus', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.infraclass', 'infraclass', 'infraclass', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.infraorder', 'infraorder', 'infraorder', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.isolate', 'isolate', 'isolate', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.kingdom', 'kingdom', 'kingdom', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.morph', 'morph', 'morph', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.no_rank', 'no rank', 'no_rank', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.order', 'order', 'order', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.parvorder', 'parvorder', 'parvorder', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.pathogroup', 'pathogroup', 'pathogroup', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.phylum', 'phylum', 'phylum', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.section', 'section', 'section', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.series', 'series', 'series', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.serogroup', 'serogroup', 'serogroup', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.serotype', 'serotype', 'serotype', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.species', 'species', 'species', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.species_group', 'species group', 'species_group', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.species_subgroup', 'species subgroup', 'species_subgroup', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.strain', 'strain', 'strain', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subclass', 'subclass', 'subclass', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subcohort', 'subcohort', 'subcohort', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subfamily', 'subfamily', 'subfamily', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subgenus', 'subgenus', 'subgenus', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subkingdom', 'subkingdom', 'subkingdom', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.suborder', 'suborder', 'suborder', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subphylum', 'subphylum', 'subphylum', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subsection', 'subsection', 'subsection', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subspecies', 'subspecies', 'subspecies', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.subtribe', 'subtribe', 'subtribe', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.superclass', 'superclass', 'superclass', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.superfamily', 'superfamily', 'superfamily', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.superkingdom', 'superkingdom', 'superkingdom', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.superorder', 'superorder', 'superorder', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.superphylum', 'superphylum', 'superphylum', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.tribe', 'tribe', 'tribe', vocabID);
	INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_rank.varietas', 'varietas', 'varietas', vocabID);

	
END//
DELIMITER ;