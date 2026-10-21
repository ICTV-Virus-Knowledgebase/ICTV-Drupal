
DELIMITER //

DROP PROCEDURE IF EXISTS `populateVocabsAndTerms`;

CREATE PROCEDURE `populateVocabsAndTerms` ()
BEGIN

	-- Declare variable(s) used below.
   DECLARE vocabID INT;

   
   -- Name class
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class');
   IF vocabID IS NULL THEN

      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'name class', 'name_class');
      SET vocabID = (SELECT LAST_INSERT_ID());

      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.acronym', 'acronym', 'acronym', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.blast_name', 'BLAST name', 'blast_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.common_name', 'common name', 'common_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.equivalent_name', 'equivalent name', 'equivalent_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.genbank_acronym', 'GenBank acronym', 'genbank_acronym', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.genbank_common_name', 'GenBank common name', 'genbank_common_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.scientific_name', 'scientific name', 'scientific_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.synonym', 'synonym', 'synonym', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_name', 'Virus name', 'virus_name', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_name_abbreviation', 'Virus name abbreviation', 'virus_name_abbreviation', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_isolate_designation', 'Virus isolate designation', 'virus_isolate_designation', vocabID);
   
   END IF;

   -- NCBI division
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division');
   IF vocabID IS NULL THEN

      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'NCBI Division', 'ncbi_division');
      SET vocabID = (SELECT LAST_INSERT_ID());

      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.bacteria', 'Bacteria', 'bacteria', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.environmental_samples', 'Environmental samples', 'environmental_samples', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.invertebrates', 'Invertebrates', 'invertebrates', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.mammals', 'Mammals', 'mammals', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.phages', 'Phages', 'phages', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.plants_and_fungi', 'Plants and Fungi', 'plants_and_fungi', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.primates', 'Primates', 'primates', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.rodents', 'Rodents', 'rodents', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.synthetic_and_chimeric', 'Synthetic and Chimeric', 'synthetic_and_chimeric', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.unassigned', 'Unassigned', 'unassigned', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.vertebrates', 'Vertebrates', 'vertebrates', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.viruses', 'Viruses', 'viruses', vocabID);

   END IF;

   -- Taxon match type
   -- INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxon match type', 'taxon_match_type');
   -- SET vocabID = (SELECT LAST_INSERT_ID());


   -- Taxonomic rank
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomic_rank');
   IF vocabID IS NULL THEN

      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxonomic rank', 'taxonomic_rank');
      SET vocabID = (SELECT LAST_INSERT_ID());

      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.biotype', 'biotype', 'biotype', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.clade', 'clade', 'clade', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.class', 'class', 'class', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.cohort', 'cohort', 'cohort', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.family', 'family', 'family', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.forma', 'forma', 'forma', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.forma_specialis', 'forma specialis', 'forma_specialis', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.genotype', 'genotype', 'genotype', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.genus', 'genus', 'genus', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.infraclass', 'infraclass', 'infraclass', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.infraorder', 'infraorder', 'infraorder', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.isolate', 'isolate', 'isolate', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.kingdom', 'kingdom', 'kingdom', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.morph', 'morph', 'morph', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.no_rank', 'no rank', 'no_rank', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.order', 'order', 'order', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.parvorder', 'parvorder', 'parvorder', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.pathogroup', 'pathogroup', 'pathogroup', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.phylum', 'phylum', 'phylum', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.section', 'section', 'section', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.series', 'series', 'series', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.serogroup', 'serogroup', 'serogroup', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.serotype', 'serotype', 'serotype', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species', 'species', 'species', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species_group', 'species group', 'species_group', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species_subgroup', 'species subgroup', 'species_subgroup', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.strain', 'strain', 'strain', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subclass', 'subclass', 'subclass', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subcohort', 'subcohort', 'subcohort', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subfamily', 'subfamily', 'subfamily', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subgenus', 'subgenus', 'subgenus', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subkingdom', 'subkingdom', 'subkingdom', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.suborder', 'suborder', 'suborder', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subphylum', 'subphylum', 'subphylum', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subsection', 'subsection', 'subsection', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subspecies', 'subspecies', 'subspecies', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subtribe', 'subtribe', 'subtribe', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superclass', 'superclass', 'superclass', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superfamily', 'superfamily', 'superfamily', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superkingdom', 'superkingdom', 'superkingdom', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superorder', 'superorder', 'superorder', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superphylum', 'superphylum', 'superphylum', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.tribe', 'tribe', 'tribe', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.varietas', 'varietas', 'varietas', vocabID);

   END IF;

   -- Taxonomy DB
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomic_rank');
   IF vocabID IS NULL THEN

      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxonomy DB', 'taxonomy_db');
      SET vocabID = (SELECT LAST_INSERT_ID());

      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_taxonomy', 'ICTV Taxonomy', 'ictv_taxonomy', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_vmr', 'ICTV VMR', 'ictv_vmr', vocabID);
      INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ncbi_taxonomy', 'NCBI Taxonomy', 'ncbi_taxonomy', vocabID);

   END IF;
   
END //

DELIMITER ;