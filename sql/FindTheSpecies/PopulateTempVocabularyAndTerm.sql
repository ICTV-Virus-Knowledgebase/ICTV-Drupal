
DROP PROCEDURE IF EXISTS `PopulateTempVocabularyAndTerm`;

DELIMITER //

CREATE PROCEDURE `PopulateTempVocabularyAndTerm` ()
BEGIN

   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TODO: Make sure PopulateTempVocabularyAndTerm includes everything it needs before using this stored procedure!';

	-- The vocabulary ID will be (re)used multiple times below.
   DECLARE vocabID INT;

   -- Name class
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class');
   IF vocabID IS NULL THEN
      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'name class', 'name_class');
      SET vocabID = (SELECT LAST_INSERT_ID());
   END IF;

   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.acronym', 'acronym', 'acronym', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.blast_name', 'BLAST name', 'blast_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.common_name', 'common name', 'common_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.equivalent_name', 'equivalent name', 'equivalent_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.genbank_acronym', 'GenBank acronym', 'genbank_acronym', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.genbank_common_name', 'GenBank common name', 'genbank_common_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.scientific_name', 'scientific name', 'scientific_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.synonym', 'synonym', 'synonym', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_name', 'Virus name', 'virus_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_name_abbreviation', 'Virus name abbreviation', 'virus_name_abbreviation', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.virus_isolate_designation', 'Virus isolate designation', 'virus_isolate_designation', vocabID) ON DUPLICATE KEY UPDATE id = id;
      

   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.abbreviation', 'abbreviation', 'abbreviation', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.synonym', 'synonym', 'synonym', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.authority', 'authority', 'authority', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.disease', 'disease', 'disease', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.genbank_accession', 'GenBank accession', 'genbank_accession', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.includes', 'includes', 'includes', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.in_part', 'in-part', 'in_part', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.isolate_abbreviation', 'isolate abbreviation', 'isolate_abbreviation', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.isolate_designation', 'isolate designation', 'isolate_designation', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.isolate_exemplar', 'isolate exemplar', 'isolate_exemplar', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.isolate_name', 'isolate name', 'isolate_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.refseq_accession', 'Refseq accession', 'refseq_accession', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.refseq_organism', 'Refseq organism', 'refseq_organism', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.taxon_name', 'taxon name', 'taxon_name', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'name_class.type_material', 'type material', 'type_material', vocabID) ON DUPLICATE KEY UPDATE id = id;


   -- NCBI division
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division');
   IF vocabID IS NULL THEN
      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'NCBI Division', 'ncbi_division');
      SET vocabID = (SELECT LAST_INSERT_ID());
   END IF;

   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.bacteria', 'Bacteria', 'bacteria', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.environmental_samples', 'Environmental samples', 'environmental_samples', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.invertebrates', 'Invertebrates', 'invertebrates', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.mammals', 'Mammals', 'mammals', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.phages', 'Phages', 'phages', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.plants_and_fungi', 'Plants and Fungi', 'plants_and_fungi', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.primates', 'Primates', 'primates', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.rodents', 'Rodents', 'rodents', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.synthetic_and_chimeric', 'Synthetic and Chimeric', 'synthetic_and_chimeric', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.unassigned', 'Unassigned', 'unassigned', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.vertebrates', 'Vertebrates', 'vertebrates', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'ncbi_division.viruses', 'Viruses', 'viruses', vocabID) ON DUPLICATE KEY UPDATE id = id;

   
   -- Taxonomic rank
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomic_rank');
   IF vocabID IS NULL THEN
      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxonomic rank', 'taxonomic_rank');
      SET vocabID = (SELECT LAST_INSERT_ID());
   END IF;

   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.biotype', 'biotype', 'biotype', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.clade', 'clade', 'clade', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.class', 'class', 'class', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.cohort', 'cohort', 'cohort', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.family', 'family', 'family', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.forma', 'forma', 'forma', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.forma_specialis', 'forma specialis', 'forma_specialis', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.genotype', 'genotype', 'genotype', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.genus', 'genus', 'genus', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.infraclass', 'infraclass', 'infraclass', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.infraorder', 'infraorder', 'infraorder', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.isolate', 'isolate', 'isolate', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.kingdom', 'kingdom', 'kingdom', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.morph', 'morph', 'morph', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.no_rank', 'no rank', 'no_rank', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.order', 'order', 'order', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.parvorder', 'parvorder', 'parvorder', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.pathogroup', 'pathogroup', 'pathogroup', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.phylum', 'phylum', 'phylum', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.section', 'section', 'section', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.series', 'series', 'series', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.serogroup', 'serogroup', 'serogroup', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.serotype', 'serotype', 'serotype', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species', 'species', 'species', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species_group', 'species group', 'species_group', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.species_subgroup', 'species subgroup', 'species_subgroup', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.strain', 'strain', 'strain', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subclass', 'subclass', 'subclass', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subcohort', 'subcohort', 'subcohort', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subfamily', 'subfamily', 'subfamily', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subgenus', 'subgenus', 'subgenus', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subkingdom', 'subkingdom', 'subkingdom', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.suborder', 'suborder', 'suborder', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subphylum', 'subphylum', 'subphylum', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subsection', 'subsection', 'subsection', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subspecies', 'subspecies', 'subspecies', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.subtribe', 'subtribe', 'subtribe', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superclass', 'superclass', 'superclass', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superfamily', 'superfamily', 'superfamily', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superkingdom', 'superkingdom', 'superkingdom', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superorder', 'superorder', 'superorder', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.superphylum', 'superphylum', 'superphylum', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.tribe', 'tribe', 'tribe', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomic_rank.varietas', 'varietas', 'varietas', vocabID) ON DUPLICATE KEY UPDATE id = id;

/*
taxonomy_rank.biotype,biotype,biotype
taxonomy_rank.clade,clade,clade
taxonomy_rank.class,class,class
taxonomy_rank.cohort,cohort,cohort
taxonomy_rank.family,family,family
taxonomy_rank.forma,forma,forma
taxonomy_rank.forma_specialis,forma specialis,forma_specialis
taxonomy_rank.genotype,genotype,genotype
taxonomy_rank.genus,genus,genus
taxonomy_rank.infraclass,infraclass,infraclass
taxonomy_rank.infraorder,infraorder,infraorder
taxonomy_rank.isolate,isolate,isolate
taxonomy_rank.kingdom,kingdom,kingdom
taxonomy_rank.morph,morph,morph
taxonomy_rank.no_rank,no rank,no_rank
taxonomy_rank.order,order,order
taxonomy_rank.parvorder,parvorder,parvorder
taxonomy_rank.pathogroup,pathogroup,pathogroup
taxonomy_rank.phylum,phylum,phylum
taxonomy_rank.realm,realm,realm
taxonomy_rank.section,section,section
taxonomy_rank.series,series,series
taxonomy_rank.serogroup,serogroup,serogroup
taxonomy_rank.serotype,serotype,serotype
taxonomy_rank.species,species,species
taxonomy_rank.species_group,species group,species_group
taxonomy_rank.species_subgroup,species subgroup,species_subgroup
taxonomy_rank.strain,strain,strain
taxonomy_rank.subclass,subclass,subclass
taxonomy_rank.subcohort,subcohort,subcohort
taxonomy_rank.subfamily,subfamily,subfamily
taxonomy_rank.subgenus,subgenus,subgenus
taxonomy_rank.subkingdom,subkingdom,subkingdom
taxonomy_rank.suborder,suborder,suborder
taxonomy_rank.subphylum,subphylum,subphylum
taxonomy_rank.subrealm,subrealm,subrealm
taxonomy_rank.subsection,subsection,subsection
taxonomy_rank.subspecies,subspecies,subspecies
taxonomy_rank.subtribe,subtribe,subtribe
taxonomy_rank.superclass,superclass,superclass
taxonomy_rank.superfamily,superfamily,superfamily
taxonomy_rank.superkingdom,superkingdom,superkingdom
taxonomy_rank.superorder,superorder,superorder
taxonomy_rank.superphylum,superphylum,superphylum
taxonomy_rank.tribe,tribe,tribe
taxonomy_rank.varietas,varietas,varietas

*/

   

   -- Taxonomy DB
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomic_rank');
   IF vocabID IS NULL THEN
      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxonomy DB', 'taxonomy_db');
      SET vocabID = (SELECT LAST_INSERT_ID());
   END IF;

   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.disease_ontology', 'Disease Ontology', 'disease_ontology', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_curation', 'ICTV Curation', 'ictv_curation', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_epithets', 'ICTV epithets', 'ictv_epithets', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_taxonomy', 'ICTV Taxonomy', 'ictv_taxonomy', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_vmr', 'ICTV VMR', 'ictv_vmr', vocabID) ON DUPLICATE KEY UPDATE id = id;
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ncbi_taxonomy', 'NCBI Taxonomy', 'ncbi_taxonomy', vocabID) ON DUPLICATE KEY UPDATE id = id;

   
END //

DELIMITER ;