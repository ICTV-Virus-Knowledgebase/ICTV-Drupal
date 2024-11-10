
DROP PROCEDURE IF EXISTS `ImportSearchableTaxon`;

DELIMITER //

-- This is used to import data from ICTV taxonomy_node, ICTV species_isolates, and the NCBI tables.
CREATE PROCEDURE ImportSearchableTaxon(
   IN `division` VARCHAR(20),
   IN `ictvID` INT(11),
   IN `ictvTaxnodeID` INT(11),
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
   DECLARE divisionTID INT;
   DECLARE errorMessage VARCHAR(500);
	DECLARE filteredName NVARCHAR(300);
	DECLARE nameClassTID INT;
	DECLARE parentTaxonomyDbTID INT;
   DECLARE phagesDivisionTID INT;
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
	
	
	-- Lookup term IDs (TODO: validate the term IDs)
	SET nameClassTID = (SELECT id FROM term WHERE full_key = CONCAT('name_class.', nameClass) LIMIT 1);
   IF nameClassTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class term ID';
   END IF;

   SET phagesDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.phages' LIMIT 1);
   IF phagesDivisionTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid phages division term ID';
   END IF;

	SET rankNameTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_rank.', rankName) LIMIT 1);
   IF rankNameTID IS NULL THEN
      SET errorMessage = CONCAT('Invalid rank name term ID for ', rankName);
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = errorMessage;
   END IF;

	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_db.', taxonomyDB) LIMIT 1);
   IF taxonomyDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy DB term ID';
   END IF;

	SET virusDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.viruses' LIMIT 1);
   IF virusDivisionTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid virus division term ID';
   END IF;
	
   -- Determine which division term ID to use.
   IF division = "viruses" THEN
      SET divisionTID = virusDivisionTID;
   ELSEIF division = "phages" THEN
      SET divisionTID = phagesDivisionTID;
   ELSE
      SET divisionTID = NULL;
   END IF;

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
	
	
	-- Create the new searchable_taxon record.
	INSERT INTO searchable_taxon (
		division_tid,
		filtered_name,
      ictv_id,
      ictv_taxnode_id,
		`name`,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	) VALUES (
		divisionTID,
		filteredName,
      ictvID,
      ictvTaxnodeID,
		name,
		nameClassTID,
		parentTaxonomyDbTID,
		parentTaxonomyID,
		rankNameTID,
		taxonomyDbTID,
		taxonomyID,
		versionID
	);
	
END //
DELIMITER ;