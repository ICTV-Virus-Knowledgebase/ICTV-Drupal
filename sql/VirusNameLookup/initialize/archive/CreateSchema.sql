

-- Dumping structure for procedure virus_name_lookup.createTaxonHistogram
DELIMITER //
CREATE PROCEDURE `createTaxonHistogram`(
	IN taxonName VARCHAR(100),
	IN taxonNameID INT
)
BEGIN

	DECLARE nameLength INT;
	
	DECLARE aCount INT;
	DECLARE bCount INT; 
	DECLARE cCount INT; 
	DECLARE dCount INT; 
	DECLARE eCount INT; 
	DECLARE fCount INT; 
	DECLARE gCount INT; 
	DECLARE hCount INT; 
	DECLARE iCount INT; 
	DECLARE jCount INT; 
	DECLARE kCount INT; 
	DECLARE lCount INT; 
	DECLARE mCount INT; 
	DECLARE nCount INT; 
	DECLARE oCount INT; 
	DECLARE pCount INT; 
	DECLARE qCount INT; 
	DECLARE rCount INT; 
	DECLARE sCount INT; 
	DECLARE tCount INT; 
	DECLARE uCount INT; 
	DECLARE vCount INT; 
	DECLARE wCount INT; 
	DECLARE xCount INT; 
	DECLARE yCount INT; 
	DECLARE zCount INT; 
	DECLARE 1Count INT; 
	DECLARE 2Count INT; 
	DECLARE 3Count INT; 
	DECLARE 4Count INT; 
	DECLARE 5Count INT; 
	DECLARE 6Count INT; 
	DECLARE 7Count INT; 
	DECLARE 8Count INT; 
	DECLARE 9Count INT; 
	DECLARE 0Count INT; 
	DECLARE spaceCount INT;
	
	-- Get the length of the taxon name parameter.
	SET nameLength = LENGTH(taxonName);
	
   -- Convert taxon name to lowercase.
	SET taxonName = LOWER(taxonName);
	
	
	-- Calculate a count for every symbol.
	SET aCount = nameLength - LENGTH(REPLACE(taxonName, 'a', ''));
	SET bCount = nameLength - LENGTH(REPLACE(taxonName, 'b', ''));
	SET cCount = nameLength - LENGTH(REPLACE(taxonName, 'c', ''));
	SET dCount = nameLength - LENGTH(REPLACE(taxonName, 'd', ''));
	SET eCount = nameLength - LENGTH(REPLACE(taxonName, 'e', ''));
	SET fCount = nameLength - LENGTH(REPLACE(taxonName, 'f', ''));
	SET gCount = nameLength - LENGTH(REPLACE(taxonName, 'g', ''));
	SET hCount = nameLength - LENGTH(REPLACE(taxonName, 'h', ''));
	SET iCount = nameLength - LENGTH(REPLACE(taxonName, 'i', ''));
	SET jCount = nameLength - LENGTH(REPLACE(taxonName, 'j', ''));
	SET kCount = nameLength - LENGTH(REPLACE(taxonName, 'k', ''));
	SET lCount = nameLength - LENGTH(REPLACE(taxonName, 'l', ''));
	SET mCount = nameLength - LENGTH(REPLACE(taxonName, 'm', ''));
	SET nCount = nameLength - LENGTH(REPLACE(taxonName, 'n', ''));
	SET oCount = nameLength - LENGTH(REPLACE(taxonName, 'o', ''));
	SET pCount = nameLength - LENGTH(REPLACE(taxonName, 'p', ''));
	SET qCount = nameLength - LENGTH(REPLACE(taxonName, 'q', ''));
	SET rCount = nameLength - LENGTH(REPLACE(taxonName, 'r', ''));
	SET sCount = nameLength - LENGTH(REPLACE(taxonName, 's', ''));
	SET tCount = nameLength - LENGTH(REPLACE(taxonName, 't', ''));
	SET uCount = nameLength - LENGTH(REPLACE(taxonName, 'u', ''));
	SET vCount = nameLength - LENGTH(REPLACE(taxonName, 'v', ''));
	SET wCount = nameLength - LENGTH(REPLACE(taxonName, 'w', ''));
	SET xCount = nameLength - LENGTH(REPLACE(taxonName, 'x', ''));
	SET yCount = nameLength - LENGTH(REPLACE(taxonName, 'y', ''));
	SET zCount = nameLength - LENGTH(REPLACE(taxonName, 'z', ''));
	SET 1Count = nameLength - LENGTH(REPLACE(taxonName, '1', ''));
	SET 2Count = nameLength - LENGTH(REPLACE(taxonName, '2', ''));
	SET 3Count = nameLength - LENGTH(REPLACE(taxonName, '3', ''));
	SET 4Count = nameLength - LENGTH(REPLACE(taxonName, '4', ''));
	SET 5Count = nameLength - LENGTH(REPLACE(taxonName, '5', ''));
	SET 6Count = nameLength - LENGTH(REPLACE(taxonName, '6', ''));
	SET 7Count = nameLength - LENGTH(REPLACE(taxonName, '7', ''));
	SET 8Count = nameLength - LENGTH(REPLACE(taxonName, '8', ''));
	SET 9Count = nameLength - LENGTH(REPLACE(taxonName, '9', ''));
	SET 0Count = nameLength - LENGTH(REPLACE(taxonName, '0', ''));
	SET spaceCount = nameLength - LENGTH(REPLACE(taxonName, ' ', ''));
	
   
   
   INSERT INTO `taxon_histogram` (
		_a, 
		_b, 
		_c, 
		_d, 
		_e, 
		_f, 
		_g, 
		_h, 
		_i, 
		_j, 
		_k, 
		_l, 
		_m, 
		_n, 
		_o, 
		_p, 
		_q, 
		_r, 
		_s, 
		_t, 
		_u, 
		_v, 
		_w, 
		_x, 
		_y, 
		_z, 
		_1, 
		_2, 
		_3, 
		_4, 
		_5, 
		_6, 
		_7, 
		_8, 
		_9, 
		_0, 
		_,
		taxon_name_id
	) VALUES (
		aCount, 
		bCount, 
		cCount, 
		dCount, 
		eCount, 
		fCount, 
		gCount, 
		hCount, 
		iCount, 
		jCount, 
		kCount, 
		lCount, 
		mCount, 
		nCount, 
		oCount, 
		pCount, 
		qCount, 
		rCount, 
		sCount, 
		tCount, 
		uCount, 
		vCount, 
		wCount, 
		xCount, 
		yCount, 
		zCount, 
		1Count, 
		2Count, 
		3Count, 
		4Count, 
		5Count, 
		6Count, 
		7Count, 
		8Count, 
		9Count, 
		0Count, 
		spaceCount,
		taxonNameID 
	); 
	
END//
DELIMITER ;

-- Dumping structure for function virus_name_lookup.getFilteredName
DELIMITER //
CREATE FUNCTION `getFilteredName`(`name` NVARCHAR(300)
) RETURNS varchar(300) CHARSET utf8mb3 COLLATE utf8mb3_general_ci
BEGIN

	DECLARE filteredName NVARCHAR(300);
	
	
	SET filteredName = 
		REPLACE(
			REPLACE(
				REPLACE(
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(
											REPLACE(
												REPLACE(
													REPLACE(
														REPLACE(NAME, '-', ' ')
													, '_', ' ')
												, '`', '')
											, '"', '')
										, '''', '')
									, '!', '')
								, '?', '')
							, '  ', ' ')
						, '(', ',')
					, ')', ',')
				, ';', ',')
			, ':', ',')
		, ',,', ',');
	
	RETURN filteredName;
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.importTaxonName
DELIMITER //
CREATE PROCEDURE `importTaxonName`(
	IN `name` NVARCHAR(300),
	IN `nameClass` VARCHAR(100),
	IN `parentTaxonomyDB` VARCHAR(100),
	IN `parentTaxonomyID` INT,
	IN `rankName` VARCHAR(50),
	IN `taxonomyDB` VARCHAR(50),
	IN `taxonomyID` INT,
	IN `versionID` INT
)
BEGIN

	-- Declare variables used below.
	DECLARE filteredName NVARCHAR(300);
	DECLARE nameClassTID INT;
	DECLARE parentTaxonomyDbTID INT;
	DECLARE rankNameTID INT;
	DECLARE taxonomyDbTID INT;
	DECLARE virusDivisionTID INT;
	

	-- Validate the input variables
	SET NAME = TRIM(NAME);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
   
   SET nameClass = TRIM(nameClass);
   IF nameClass IS NULL OR LENGTH(nameClass) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class parameter';
   END IF;
	
	SET parentTaxonomyDB = TRIM(parentTaxonomyDB);
	
	SET rankName = TRIM(rankName);
	IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid rank name parameter';
   END IF;
	
	SET taxonomyDB = TRIM(taxonomyDB);
	IF taxonomyDB IS NULL OR LENGTH(taxonomyDB) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy DB parameter';
   END IF;
   
   IF taxonomyID IS NULL OR taxonomyID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy ID parameter';
   END IF;
	
	
	-- SELECT * FROM term WHERE full_key = CONCAT('taxonomic_rank.', rankName) LIMIT 1;
	
	-- Lookup term IDs
	SET nameClassTID = (SELECT id FROM term WHERE full_key = CONCAT('name_class.', nameClass) LIMIT 1);
	SET rankNameTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomic_rank.', rankName) LIMIT 1);
	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_db.', taxonomyDB) LIMIT 1);
	SET virusDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.viruses' LIMIT 1);
	
	IF parentTaxonomyDB IS NOT NULL AND LENGTH(parentTaxonomyDB) > 0 THEN
		BEGIN 
			-- Lookup the term ID for parent taxonomy DB and validate it.
			SET parentTaxonomyDbTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_db.', parentTaxonomyDB) LIMIT 1);
			IF parentTaxonomyDbTID IS NULL THEN 
				SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for parent taxonomy DB parameter';
		   END IF;
		   
		   -- Validate the parent taxonomy ID.
		   IF parentTaxonomyID IS NULL THEN 
				SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid parent taxonomy ID parameter';
		   END IF;
		END;
	ELSE
		BEGIN 
			SET parentTaxonomyDbTID = NULL;
			SET parentTaxonomyID = NULL;
		END;
	END IF;
	
	
	-- Filter the name
	SET filteredName = getFilteredName(NAME);
	
	
	-- Create the new taxon_name record.
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		NAME,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	) VALUES (
		virusDivisionTID,
		filteredName,
		NAME,
		nameClassTID,
		parentTaxonomyDbTID,
		parentTaxonomyID,
		rankName,
		rankNameTID,
		taxonomyDbTID,
		taxonomyID,
		versionID
	);

END//
DELIMITER ;

-- Dumping structure for table virus_name_lookup.ncbi_division
CREATE TABLE IF NOT EXISTS `ncbi_division` (
  `id` tinyint(4) NOT NULL,
  `cde` varchar(10) NOT NULL,
  `name` varchar(30) NOT NULL,
  `comments` varchar(60) DEFAULT NULL,
  `tid` int(10) unsigned DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the division name.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.ncbi_name
CREATE TABLE IF NOT EXISTS `ncbi_name` (
  `tax_id` mediumint(9) NOT NULL,
  `name_txt` varchar(500) NOT NULL,
  `unique_name` varchar(500) DEFAULT NULL,
  `name_class` varchar(20) NOT NULL,
  `name_class_tid` int(11) DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the name class.',
  PRIMARY KEY (`tax_id`,`name_txt`,`name_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.ncbi_node
CREATE TABLE IF NOT EXISTS `ncbi_node` (
  `tax_id` mediumint(9) NOT NULL,
  `parent_tax_id` mediumint(9) NOT NULL,
  `rank_name` varchar(20) NOT NULL,
  `rank_name_tid` int(11) DEFAULT NULL COMMENT 'This is a custom column that provides a term ID equivalent for the rank name.',
  `embl_code` varchar(10) DEFAULT NULL,
  `division_id` tinyint(4) DEFAULT NULL,
  `inherited_div_flag` tinyint(4) DEFAULT NULL,
  `genetic_code_id` tinyint(4) DEFAULT NULL,
  `inherited_gc_flag` tinyint(4) DEFAULT NULL,
  `mitochondrial_genetic_code_id` tinyint(4) DEFAULT NULL,
  `inherited_mgc_flag` tinyint(4) DEFAULT NULL,
  `genbank_hidden_flag` tinyint(4) DEFAULT NULL,
  `hidden_subtree_root_flag` tinyint(4) DEFAULT NULL,
  `comments` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`tax_id`),
  KEY `FK_division_id` (`division_id`),
  KEY `FK_parent_tax_id_tax_id` (`parent_tax_id`) USING BTREE,
  CONSTRAINT `FK_division_id` FOREIGN KEY (`division_id`) REFERENCES `ncbi_division` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_parent_tax_id_tax_id` FOREIGN KEY (`parent_tax_id`) REFERENCES `ncbi_node` (`tax_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for procedure virus_name_lookup.populateTaxonNameFromNCBI
DELIMITER //
CREATE PROCEDURE `populateTaxonNameFromNCBI`()
BEGIN
  
  
	-- TODO: What should we do if taxon_name already has NCBI Taxonomy records?
	
	DECLARE taxonomyDbTID INT DEFAULT NULL;
	
	-- ====================================================================================================
	-- Lookup the term ID for the NCBI taxonomy DB.
	-- ====================================================================================================
	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
	IF taxonomyDbTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid term ID for taxonomy_db.ncbi_taxonomy';
	END IF;
	
	
	-- ====================================================================================================
	-- Create taxon_name records from (a subset of) NCBI Taxonomy.
	-- ====================================================================================================
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		is_valid,
		name,
		name_class_tid,
		parent_taxonomy_id,
		rank_name,
		rank_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	)
	
	SELECT 
		d.tid AS division_tid,
		
		-- TODO: What's a good way to replace this with getFilteredName()?
		LOWER(
			REPLACE( 
				REPLACE( 
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(nname.name_txt, '-', ' ')
									, '_',' ')
								, '"', '')
							, '?', '')
						, '`', '')
					, '''', '')
				, '!', '')
			, '.', '')
		) AS filtered_name,
		1 AS is_valid,
		nname.name_txt AS name,
		nname.name_class_tid,
		nnode.parent_tax_id AS parent_taxonomy_id,
		nnode.rank_name,
		nnode.rank_name_tid,
		taxonomyDbTID AS taxonomy_db_tid,
		nnode.tax_id AS taxonomy_id,
		0 AS version_id
		
	FROM ncbi_node nnode
	JOIN ncbi_division d ON d.id = nnode.division_id
	JOIN ncbi_name nname ON nname.tax_id = nnode.tax_id
	WHERE nname.name_class_tid IS NOT NULL 
	AND d.tid IN (
		SELECT divTerm.id
		FROM term divTerm
		WHERE divTerm.full_key IN (
			'ncbi_division.bacteria',
			'ncbi_division.environmental_samples',
			'ncbi_division.phages',
			'ncbi_division.synthetic_and_chimeric',
			'ncbi_division.unassigned',
			'ncbi_division.viruses'
		)
	);
	
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.populateVocabsAndTerms
DELIMITER //
CREATE PROCEDURE `populateVocabsAndTerms`()
BEGIN

	-- dmd 07/06/24 TODO: finish this!!!
	
	-- Declare variables used below.
   DECLARE vocabID INT;

   /*
   -- Curation type
   INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'curation type', 'curation_type');
   SET vocabID = (SELECT LAST_INSERT_ID());

   -- Host token type
   INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'host token type', 'host_token_type');
   SET vocabID = (SELECT LAST_INSERT_ID());

   */

   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'job_status');
   IF vocabID IS NULL THEN
   
      select 'about to create job_status';
      -- INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'job status', 'job_status');

   ELSE select 'job_status already exists';
   END IF;

   -- INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'job type', 'job_type');

   /*
   -- Name class
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


   -- NCBI division
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


   -- Taxon match type
   -- INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxon match type', 'taxon_match_type');
   -- SET vocabID = (SELECT LAST_INSERT_ID());


   -- Taxonomic rank
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


   -- Taxonomy DB
   INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'taxonomy DB', 'taxonomy_db');
   SET vocabID = (SELECT LAST_INSERT_ID());

   INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_taxonomy', 'ICTV Taxonomy', 'ictv_taxonomy', vocabID);
   INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ictv_vmr', 'ICTV VMR', 'ictv_vmr', vocabID);
   INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'taxonomy_db.ncbi_taxonomy', 'NCBI Taxonomy', 'ncbi_taxonomy', vocabID);
   */

END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.searchTaxonHistogram
DELIMITER //
CREATE PROCEDURE `searchTaxonHistogram`(
	IN searchName VARCHAR(100)
)
BEGIN

   DECLARE nameLength INT;

   -- TESTING
   DECLARE diffThreshold INT;
   DECLARE maxDifferences INT;

	
	DECLARE aCount INT;
	DECLARE bCount INT; 
	DECLARE cCount INT; 
	DECLARE dCount INT; 
	DECLARE eCount INT; 
	DECLARE fCount INT; 
	DECLARE gCount INT; 
	DECLARE hCount INT; 
	DECLARE iCount INT; 
	DECLARE jCount INT; 
	DECLARE kCount INT; 
	DECLARE lCount INT; 
	DECLARE mCount INT; 
	DECLARE nCount INT; 
	DECLARE oCount INT; 
	DECLARE pCount INT; 
	DECLARE qCount INT; 
	DECLARE rCount INT; 
	DECLARE sCount INT; 
	DECLARE tCount INT; 
	DECLARE uCount INT; 
	DECLARE vCount INT; 
	DECLARE wCount INT; 
	DECLARE xCount INT; 
	DECLARE yCount INT; 
	DECLARE zCount INT; 
	DECLARE 1Count INT; 
	DECLARE 2Count INT; 
	DECLARE 3Count INT; 
	DECLARE 4Count INT; 
	DECLARE 5Count INT; 
	DECLARE 6Count INT; 
	DECLARE 7Count INT; 
	DECLARE 8Count INT; 
	DECLARE 9Count INT; 
	DECLARE 0Count INT; 
	DECLARE spaceCount INT;
	
	-- Get the length of the search name parameter.
	SET nameLength = LENGTH(searchName);
	
   -- Convert search name to lowercase.
	SET searchName = LOWER(searchName);
	
	SET diffThreshold = 1;
   SET maxDifferences = 10;
   
	
	-- Calculate a count for every symbol.
	SET aCount = nameLength - LENGTH(REPLACE(searchName, 'a', ''));
	SET bCount = nameLength - LENGTH(REPLACE(searchName, 'b', ''));
	SET cCount = nameLength - LENGTH(REPLACE(searchName, 'c', ''));
	SET dCount = nameLength - LENGTH(REPLACE(searchName, 'd', ''));
	SET eCount = nameLength - LENGTH(REPLACE(searchName, 'e', ''));
	SET fCount = nameLength - LENGTH(REPLACE(searchName, 'f', ''));
	SET gCount = nameLength - LENGTH(REPLACE(searchName, 'g', ''));
	SET hCount = nameLength - LENGTH(REPLACE(searchName, 'h', ''));
	SET iCount = nameLength - LENGTH(REPLACE(searchName, 'i', ''));
	SET jCount = nameLength - LENGTH(REPLACE(searchName, 'j', ''));
	SET kCount = nameLength - LENGTH(REPLACE(searchName, 'k', ''));
	SET lCount = nameLength - LENGTH(REPLACE(searchName, 'l', ''));
	SET mCount = nameLength - LENGTH(REPLACE(searchName, 'm', ''));
	SET nCount = nameLength - LENGTH(REPLACE(searchName, 'n', ''));
	SET oCount = nameLength - LENGTH(REPLACE(searchName, 'o', ''));
	SET pCount = nameLength - LENGTH(REPLACE(searchName, 'p', ''));
	SET qCount = nameLength - LENGTH(REPLACE(searchName, 'q', ''));
	SET rCount = nameLength - LENGTH(REPLACE(searchName, 'r', ''));
	SET sCount = nameLength - LENGTH(REPLACE(searchName, 's', ''));
	SET tCount = nameLength - LENGTH(REPLACE(searchName, 't', ''));
	SET uCount = nameLength - LENGTH(REPLACE(searchName, 'u', ''));
	SET vCount = nameLength - LENGTH(REPLACE(searchName, 'v', ''));
	SET wCount = nameLength - LENGTH(REPLACE(searchName, 'w', ''));
	SET xCount = nameLength - LENGTH(REPLACE(searchName, 'x', ''));
	SET yCount = nameLength - LENGTH(REPLACE(searchName, 'y', ''));
	SET zCount = nameLength - LENGTH(REPLACE(searchName, 'z', ''));
	SET 1Count = nameLength - LENGTH(REPLACE(searchName, '1', ''));
	SET 2Count = nameLength - LENGTH(REPLACE(searchName, '2', ''));
	SET 3Count = nameLength - LENGTH(REPLACE(searchName, '3', ''));
	SET 4Count = nameLength - LENGTH(REPLACE(searchName, '4', ''));
	SET 5Count = nameLength - LENGTH(REPLACE(searchName, '5', ''));
	SET 6Count = nameLength - LENGTH(REPLACE(searchName, '6', ''));
	SET 7Count = nameLength - LENGTH(REPLACE(searchName, '7', ''));
	SET 8Count = nameLength - LENGTH(REPLACE(searchName, '8', ''));
	SET 9Count = nameLength - LENGTH(REPLACE(searchName, '9', ''));
	SET 0Count = nameLength - LENGTH(REPLACE(searchName, '0', ''));
	SET spaceCount = nameLength - LENGTH(REPLACE(searchName, ' ', ''));


	SELECT *
	FROM (
		SELECT *, 
			(aDiff + bDiff + cDiff + dDiff + eDiff + fDiff + gDiff + hDiff + iDiff + jDiff + 
			kDiff + lDiff + mDiff + nDiff + oDiff + pDiff + qDiff + rDiff + sDiff + tDiff + 
			uDiff + vDiff + wDiff + xDiff + yDiff + zDiff + 1Diff + 2Diff + 3Diff + 4Diff + 
			5Diff + 6Diff + 7Diff + 8Diff + 9Diff + 0Diff + spaceDiff) AS totalDiff 
		FROM (
			SELECT 
				_a, aCount, ABS(aCount - _a) AS aDiff, 
				_b, bCount, ABS(bCount - _b) AS bDiff, 
				_c, cCount, ABS(cCount - _c) AS cDiff, 
				_d, dCount, ABS(dCount - _d) AS dDiff, 
				_e, eCount, ABS(eCount - _e) AS eDiff, 
				_f, fCount, ABS(fCount - _f) AS fDiff, 
				_g, gCount, ABS(gCount - _g) AS gDiff, 
				_h, hCount, ABS(hCount - _h) AS hDiff, 
				_i, iCount, ABS(iCount - _i) AS iDiff, 
				_j, jCount, ABS(jCount - _j) AS jDiff, 
				_k, kCount, ABS(kCount - _k) AS kDiff, 
				_l, lCount, ABS(lCount - _l) AS lDiff, 
				_m, mCount, ABS(mCount - _m) AS mDiff, 
				_n, nCount, ABS(nCount - _n) AS nDiff, 
				_o, oCount, ABS(oCount - _o) AS oDiff, 
				_p, pCount, ABS(pCount - _p) AS pDiff, 
				_q, qCount, ABS(qCount - _q) AS qDiff, 
				_r, rCount, ABS(rCount - _r) AS rDiff, 
				_s, sCount, ABS(sCount - _s) AS sDiff, 
				_t, tCount, ABS(tCount - _t) AS tDiff, 
				_u, uCount, ABS(uCount - _u) AS uDiff, 
				_v, vCount, ABS(vCount - _v) AS vDiff, 
				_w, wCount, ABS(wCount - _w) AS wDiff, 
				_x, xCount, ABS(xCount - _x) AS xDiff, 
				_y, yCount, ABS(yCount - _y) AS yDiff, 
				_z, zCount, ABS(zCount - _z) AS zDiff, 
				_1, 1Count, ABS(1Count - _1) AS 1Diff, 
				_2, 2Count, ABS(2Count - _2) AS 2Diff, 
				_3, 3Count, ABS(3Count - _3) AS 3Diff, 
				_4, 4Count, ABS(4Count - _4) AS 4Diff, 
				_5, 5Count, ABS(5Count - _5) AS 5Diff, 
				_6, 6Count, ABS(6Count - _6) AS 6Diff, 
				_7, 7Count, ABS(7Count - _7) AS 7Diff, 
				_8, 8Count, ABS(8Count - _8) AS 8Diff, 
				_9, 9Count, ABS(9Count - _9) AS 9Diff, 
				_0, 0Count, ABS(0Count - _0) AS 0Diff, 
				_, spaceCount, ABS(spaceCount - _) AS spaceDiff,
				taxon_name_id
			FROM taxon_histogram 
			WHERE 
			((_a = 0 AND aCount = 0) OR (_a >= aCount - diffThreshold AND _a <= aCount + 1)) AND 
			(_b >= bCount - diffThreshold AND _b <= bCount + 1) AND 
			(_c >= cCount - diffThreshold AND _c <= cCount + 1) AND 
			(_d >= dCount - diffThreshold AND _d <= dCount + 1) AND 
			(_e >= eCount - diffThreshold AND _e <= eCount + 1) AND 
			(_f >= fCount - diffThreshold AND _f <= fCount + 1) AND 
			(_g >= gCount - diffThreshold AND _g <= gCount + 1) AND 
			(_h >= hCount - diffThreshold AND _h <= hCount + 1) AND 
			(_i >= iCount - diffThreshold AND _i <= iCount + 1) AND 
			(_j >= jCount - diffThreshold AND _j <= jCount + 1) AND 
			(_k >= kCount - diffThreshold AND _k <= kCount + 1) AND 
			(_l >= lCount - diffThreshold AND _l <= lCount + 1) AND 
			(_m >= mCount - diffThreshold AND _m <= mCount + 1) AND 
			(_n >= nCount - diffThreshold AND _n <= nCount + 1) AND 
			(_o >= oCount - diffThreshold AND _o <= oCount + 1) AND 
			(_p >= pCount - diffThreshold AND _p <= pCount + 1) AND 
			(_q >= qCount - diffThreshold AND _q <= qCount + 1) AND 
			(_r >= rCount - diffThreshold AND _r <= rCount + 1) AND 
			(_s >= sCount - diffThreshold AND _s <= sCount + 1) AND 
			(_t >= tCount - diffThreshold AND _t <= tCount + 1) AND 
			(_u >= uCount - diffThreshold AND _u <= uCount + 1) AND 
			(_v >= vCount - diffThreshold AND _v <= vCount + 1) AND 
			(_w >= wCount - diffThreshold AND _w <= wCount + 1) AND 
			(_x >= xCount - diffThreshold AND _x <= xCount + 1) AND 
			(_y >= yCount - diffThreshold AND _y <= yCount + 1) AND 
			(_z >= zCount - diffThreshold AND _z <= zCount + 1) AND 
			(_1 >= 1Count - diffThreshold AND _1 <= 1Count + 1) AND 
			(_2 >= 2Count - diffThreshold AND _2 <= 2Count + 1) AND 
			(_3 >= 3Count - diffThreshold AND _3 <= 3Count + 1) AND 
			(_4 >= 4Count - diffThreshold AND _4 <= 4Count + 1) AND 
			(_5 >= 5Count - diffThreshold AND _5 <= 5Count + 1) AND 
			(_6 >= 6Count - diffThreshold AND _6 <= 6Count + 1) AND 
			(_7 >= 7Count - diffThreshold AND _7 <= 7Count + 1) AND 
			(_8 >= 8Count - diffThreshold AND _8 <= 8Count + 1) AND 
			(_9 >= 9Count - diffThreshold AND _9 <= 9Count + 1) AND 
			(_0 >= 0Count - diffThreshold AND _0 <= 0Count + 1) AND 
			(_ >= spaceCount - diffThreshold AND _ <= spaceCount + 1)
		) results1
	) results2
	JOIN taxon_name tn ON tn.id = taxon_name_id
	WHERE totalDiff <= maxDifferences
	ORDER BY totalDiff DESC;
	
END//
DELIMITER ;

-- Dumping structure for table virus_name_lookup.species_isolates
CREATE TABLE IF NOT EXISTS `species_isolates` (
  `isolate_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `taxnode_id` int(11) unsigned DEFAULT NULL,
  `species_sort` int(10) unsigned DEFAULT NULL,
  `isolate_sort` int(10) unsigned NOT NULL,
  `species_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `isolate_type` char(1) NOT NULL,
  `isolate_names` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `_isolate_name` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `isolate_abbrevs` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `isolate_designation` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `genbank_accessions` varchar(4000) DEFAULT NULL,
  `refseq_accessions` varchar(4000) DEFAULT NULL,
  `genome_coverage` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `molecule` varchar(50) DEFAULT NULL,
  `host_source` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `refseq_organism` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `refseq_taxids` varchar(4000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `update_change` varchar(50) DEFAULT NULL,
  `update_prev_species` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `update_prev_taxnode_id` int(10) unsigned DEFAULT NULL,
  `update_change_proposal` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`isolate_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='dmd 07/06/24: I don''t think this is necessary since I created a stored procedure (and Python export code) to export from ICTVonline39 and Python code to import into taxon_name.';

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.taxon_histogram
CREATE TABLE IF NOT EXISTS `taxon_histogram` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `_a` int(10) NOT NULL DEFAULT 0,
  `_b` int(10) NOT NULL DEFAULT 0,
  `_c` int(10) NOT NULL DEFAULT 0,
  `_d` int(10) NOT NULL DEFAULT 0,
  `_e` int(10) NOT NULL DEFAULT 0,
  `_f` int(10) NOT NULL DEFAULT 0,
  `_g` int(10) NOT NULL DEFAULT 0,
  `_h` int(10) NOT NULL DEFAULT 0,
  `_i` int(10) NOT NULL DEFAULT 0,
  `_j` int(10) NOT NULL DEFAULT 0,
  `_k` int(10) NOT NULL DEFAULT 0,
  `_l` int(10) NOT NULL DEFAULT 0,
  `_m` int(10) NOT NULL DEFAULT 0,
  `_n` int(10) NOT NULL DEFAULT 0,
  `_o` int(10) NOT NULL DEFAULT 0,
  `_p` int(10) NOT NULL DEFAULT 0,
  `_q` int(10) NOT NULL DEFAULT 0,
  `_r` int(10) NOT NULL DEFAULT 0,
  `_s` int(10) NOT NULL DEFAULT 0,
  `_t` int(10) NOT NULL DEFAULT 0,
  `_u` int(10) NOT NULL DEFAULT 0,
  `_v` int(10) NOT NULL DEFAULT 0,
  `_w` int(10) NOT NULL DEFAULT 0,
  `_x` int(10) NOT NULL DEFAULT 0,
  `_y` int(10) NOT NULL DEFAULT 0,
  `_z` int(10) NOT NULL DEFAULT 0,
  `_1` int(10) NOT NULL DEFAULT 0,
  `_2` int(10) NOT NULL DEFAULT 0,
  `_3` int(10) NOT NULL DEFAULT 0,
  `_4` int(10) NOT NULL DEFAULT 0,
  `_5` int(10) NOT NULL DEFAULT 0,
  `_6` int(10) NOT NULL DEFAULT 0,
  `_7` int(10) NOT NULL DEFAULT 0,
  `_8` int(10) NOT NULL DEFAULT 0,
  `_9` int(10) NOT NULL DEFAULT 0,
  `_0` int(10) NOT NULL DEFAULT 0,
  `_` int(10) NOT NULL DEFAULT 0,
  `taxon_name_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.taxon_name
CREATE TABLE IF NOT EXISTS `taxon_name` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'The unique identifier of the taxon record',
  `division_tid` int(10) unsigned DEFAULT NULL COMMENT 'The NCBI Division ID (bacteria, mammals, viruses, etc.)',
  `filtered_name` varchar(200) NOT NULL COMMENT 'A variation of the name without special characters',
  `is_valid` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Is this taxon information current/valid or obsolete?',
  `name` varchar(200) NOT NULL COMMENT 'The taxon name',
  `name_class_tid` int(10) unsigned NOT NULL COMMENT 'The category or type of name (ex. "scientific name"), inspired by NCBI name class',
  `parent_taxonomy_db_tid` int(10) unsigned DEFAULT NULL COMMENT 'The taxonomy database source of the taxon''s parent (optional)',
  `parent_taxonomy_id` int(11) unsigned DEFAULT NULL COMMENT 'The parent''s unique identifier within the parent taxonomy database',
  `rank_name` varchar(30) NOT NULL COMMENT 'The taxonomic rank',
  `rank_name_tid` int(10) unsigned DEFAULT NULL COMMENT 'The term ID of the taxonomic rank',
  `taxonomy_db_tid` int(10) unsigned NOT NULL COMMENT 'The taxonomy database source of this taxon''s information',
  `taxonomy_id` int(11) unsigned NOT NULL COMMENT 'The taxon''s unique identifier within the source taxonomy database',
  `version_id` int(10) DEFAULT NULL COMMENT 'For ICTV taxa, this corresponds to MSL release number',
  `created_on` datetime NOT NULL DEFAULT curdate() COMMENT 'The date/time when this row was added to the database',
  PRIMARY KEY (`id`),
  KEY `FK_taxon_name_term` (`name_class_tid`),
  KEY `FK_taxon_name_division` (`division_tid`),
  KEY `FK_taxon_name_taxonomy_db` (`taxonomy_db_tid`),
  KEY `FK_taxon_name_rank` (`rank_name_tid`) USING BTREE,
  CONSTRAINT `FK_taxon_name_division` FOREIGN KEY (`division_tid`) REFERENCES `term` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_taxon_name_rank_name` FOREIGN KEY (`rank_name_tid`) REFERENCES `term` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_taxon_name_taxonomy_db` FOREIGN KEY (`taxonomy_db_tid`) REFERENCES `term` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_taxon_name_term` FOREIGN KEY (`name_class_tid`) REFERENCES `term` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1380474 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.term
CREATE TABLE IF NOT EXISTS `term` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `full_key` varchar(256) NOT NULL,
  `label` varchar(128) NOT NULL,
  `term_key` varchar(128) NOT NULL,
  `vocab_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UK_term_full_key` (`full_key`),
  KEY `FK_vocabulary` (`vocab_id`) USING BTREE,
  CONSTRAINT `FK_term_vocabulary` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table virus_name_lookup.vocabulary
CREATE TABLE IF NOT EXISTS `vocabulary` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `label` varchar(128) NOT NULL,
  `vocab_key` varchar(128) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UK_vocab_label` (`label`) USING BTREE,
  UNIQUE KEY `UK_vocab_key` (`vocab_key`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for view virus_name_lookup.v_taxon_name
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_taxon_name` (
	`id` INT(11) UNSIGNED NOT NULL COMMENT 'The unique identifier of the taxon record',
	`division` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
	`division_tid` INT(10) UNSIGNED NULL COMMENT 'The NCBI Division ID (bacteria, mammals, viruses, etc.)',
	`filtered_name` VARCHAR(200) NOT NULL COMMENT 'A variation of the name without special characters' COLLATE 'utf8mb4_general_ci',
	`is_valid` BIT(1) NOT NULL COMMENT 'Is this taxon information current/valid or obsolete?',
	`name` VARCHAR(200) NOT NULL COMMENT 'The taxon name' COLLATE 'utf8mb4_general_ci',
	`name_class` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
	`name_class_tid` INT(10) UNSIGNED NOT NULL COMMENT 'The category or type of name (ex. "scientific name"), inspired by NCBI name class',
	`parent_taxonomy_db` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
	`parent_taxonomy_id` INT(11) UNSIGNED NULL COMMENT 'The parent\'s unique identifier within the parent taxonomy database',
	`rank_name` VARCHAR(30) NOT NULL COMMENT 'The taxonomic rank' COLLATE 'utf8mb4_general_ci',
	`rank_name_tid` INT(10) UNSIGNED NULL COMMENT 'The term ID of the taxonomic rank',
	`taxonomy_db` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
	`taxonomy_db_tid` INT(10) UNSIGNED NOT NULL COMMENT 'The taxonomy database source of this taxon\'s information',
	`taxonomy_id` INT(11) UNSIGNED NOT NULL COMMENT 'The taxon\'s unique identifier within the source taxonomy database',
	`version_id` INT(10) NULL COMMENT 'For ICTV taxa, this corresponds to MSL release number',
	`created_on` DATETIME NOT NULL COMMENT 'The date/time when this row was added to the database'
) ENGINE=MyISAM;

-- Dumping structure for view virus_name_lookup.v_taxon_name
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_taxon_name`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_taxon_name` AS SELECT 

	tn.id,
	divTerm.term_key AS division,
	tn.division_tid,
	tn.filtered_name,
	tn.is_valid,
	tn.name,
	nameClass.term_key AS name_class,
	tn.name_class_tid,
	parentTaxDB.term_key AS parent_taxonomy_db,
	tn.parent_taxonomy_id,
	tn.rank_name,
	tn.rank_name_tid,
	taxDB.term_key AS taxonomy_db,
	tn.taxonomy_db_tid,
	tn.taxonomy_id,
	tn.version_id,
	tn.created_on

FROM taxon_name tn
JOIN term divTerm ON divTerm.id = tn.division_tid
JOIN term nameClass ON nameClass.id = tn.name_class_tid
JOIN term parentTaxDB ON parentTaxDB.id = tn.parent_taxonomy_db_tid
JOIN term rankName ON rankName.id = tn.rank_name_tid
JOIN term taxDB ON taxDB.id = tn.taxonomy_db_tid ;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
