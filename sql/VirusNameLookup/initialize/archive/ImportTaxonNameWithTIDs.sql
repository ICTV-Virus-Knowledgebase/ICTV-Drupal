DELIMITER //

-- NOTE: This is not yet used! It's meant to be an optimization of importTaxonName.

DROP PROCEDURE IF EXISTS `importTaxonNameWithTIDs`

CREATE PROCEDURE `importTaxonNameWithTIDs`(
   IN `ictvTaxNodeID` INT,
	IN `name` NVARCHAR(300),
	IN `nameClassTID` INT,
	IN `parentTaxonomyDBTID` INT,
	IN `parentTaxonomyID` INT,
	IN `rankName` VARCHAR(50),
   IN `rankNameTID` INT,
	IN `taxonomyDbTID` INT,
	IN `taxonomyID` INT,
	IN `versionID` INT,
   IN `virusDivisionTID` INT
)
    MODIFIES SQL DATA
BEGIN

	-- Declare variables used below.
	DECLARE filteredName NVARCHAR(300);
	

	-- Validate the input variables
	SET name = TRIM(name);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
   
   IF nameClassTID IS NULL OR nameClassTID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class TID parameter';
   END IF;
	
	SET rankName = REPLACE(TRIM(rankName), ' ', '_');
	IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
      SET rankName = "no_rank";
   END IF;
	
	IF taxonomyDbTID IS NULL OR taxonomyDbTID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy DB TID parameter';
   END IF;
   
   IF taxonomyID IS NULL OR taxonomyID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy ID parameter';
   END IF;
	
	
	-- Filter the name
	SET filteredName = getFilteredName(name);
	
	
	-- Create the new taxon_name record.
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
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