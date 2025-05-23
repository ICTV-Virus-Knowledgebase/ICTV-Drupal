
DROP PROCEDURE IF EXISTS `importTaxonName`;

DELIMITER // 

CREATE PROCEDURE `importTaxonName`(
   IN `ictvMslRelease` INT,
   IN `ictvName` VARCHAR(300),
   IN `ictvRankName` VARCHAR(100),
   IN `ictvTaxNodeID` INT,
	IN `name` VARCHAR(300),
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
   SET ictvName = TRIM(ictvName);
   IF LENGTH(ictvName) < 1 THEN
      SET ictvName = NULL;
   END IF;

   SET ictvRankName = TRIM(ictvRankName);
   IF LENGTH(ictvRankName) < 1 THEN
      SET ictvRankName = NULL;
   END IF;

	SET name = TRIM(name);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
   
   SET nameClass = TRIM(nameClass);
   IF nameClass IS NULL OR LENGTH(nameClass) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class parameter';
   END IF;
	
	SET parentTaxonomyDB = TRIM(parentTaxonomyDB);
	
	SET rankName = REPLACE(TRIM(rankName), ' ', '_');
	IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
      SET rankName = "no_rank";
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
      ictv_msl_release,
      ictv_name,
      ictv_rank_name,
      ictv_taxnode_id,
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
      ictvMslRelease,
      ictvName,
      ictvRankName,
      ictvTaxNodeID,
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