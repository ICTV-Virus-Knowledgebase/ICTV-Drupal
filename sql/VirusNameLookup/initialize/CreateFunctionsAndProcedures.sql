-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.1.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.3.0.6589
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for procedure virus_name_lookup.createTaxonHistogram
DELIMITER //
CREATE PROCEDURE `createTaxonHistogram`(
	IN `taxonName` VARCHAR(500),
	IN `taxonNameID` INT
)
BEGIN

	DECLARE firstCharacter VARCHAR(1);
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
	
	-- Get the first character.
   SET firstCharacter = LEFT(taxonName, 1);
   
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
		`first_character`,
		`length`,
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
		firstCharacter,
		nameLength,
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
			, ',,', ',')
		, '/', ' ')
	, '\\', ' ');
	
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
    MODIFIES SQL DATA
BEGIN

	-- Declare variables used below.
	DECLARE filteredName NVARCHAR(300);
	DECLARE nameClassTID INT;
	DECLARE parentTaxonomyDbTID INT;
	DECLARE rankNameTID INT;
	DECLARE taxonomyDbTID INT;
	DECLARE virusDivisionTID INT;
	

	-- Validate the input variables
	SET name = TRIM(name);
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
	
	
	-- Lookup term IDs
	SET nameClassTID = (SELECT id FROM term WHERE full_key = CONCAT('name_class.', nameClass) LIMIT 1);
	SET rankNameTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_rank.', rankName) LIMIT 1);
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
	SET filteredName = getFilteredName(name);
	
	
	-- Create the new taxon_name record.
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		`name`,
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
		name,
		nameClassTID,
		parentTaxonomyDbTID,
		parentTaxonomyID,
		rankName,
		rankNameTID,
		taxonomyDbTID,
		taxonomyID,
		versionID
	);

	SELECT LAST_INSERT_ID();
	
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.populateTaxonHistogram
DELIMITER //
CREATE PROCEDURE `populateTaxonHistogram`()
    MODIFIES SQL DATA
BEGIN

	DECLARE done INT DEFAULT FALSE;
	DECLARE id INT;
	DECLARE filteredName NVARCHAR(500);
	
	DECLARE taxonCursor CURSOR FOR 
		SELECT 
			tn.id, 
			tn.filtered_name
		FROM taxon_name tn
		LIMIT 100;
		/*WHERE tn.id NOT IN (
			SELECT taxon_name_id FROM taxon_histogram
		);*/
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	
	OPEN taxonCursor;
	
	read_loop: LOOP
	
		FETCH taxonCursor INTO id, filteredName;
		
		CALL createTaxonHistogram(filteredName, id);
	
		IF done THEN
			LEAVE read_loop;
		END IF;
		
	END LOOP;
	
	CLOSE taxonCursor;
  
END//
DELIMITER ;

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
	IN `searchName` VARCHAR(100)
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
   SET maxDifferences = 4;
   
	
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
			-- For every character, this returns:
			-- The test record's number of occurrences
			-- The number of occurrences in the search text
			-- The difference between the two counts
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
				_, 
				spaceCount, 
				ABS(spaceCount - _) AS spaceDiff,
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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
