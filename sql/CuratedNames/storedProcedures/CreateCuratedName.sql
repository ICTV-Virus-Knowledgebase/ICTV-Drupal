
DROP PROCEDURE IF EXISTS `CreateCuratedName`;


DELIMITER //

CREATE PROCEDURE CreateCuratedName(
   IN `createdBy` VARCHAR(100),
   IN `division` VARCHAR(100),
   IN `ictvID` INT,
   IN `ictvTaxnodeID` INT,
   IN `name` NVARCHAR(300),
   IN `nameClass` VARCHAR(100),
   IN `rankName` VARCHAR(100),
   IN `taxonomyDB` VARCHAR(100),
   IN `taxonomyID` INT,
   IN `type` VARCHAR(100),
   IN `versionID` INT
)
BEGIN

   -- Declare variables used below.
   DECLARE divisionTID INT;
   DECLARE errorMessage TEXT;
   DECLARE nameClassTID INT;
   DECLARE phagesDivisionTID INT;
   DECLARE rankNameTID INT;
   DECLARE taxonomyDbTID INT;
   DECLARE typeTID INT;
   DECLARE uid BINARY(16);
   DECLARE virusDivisionTID INT;


   -- Validate the input parameters.
   SET createdBy = TRIM(createdBy);
   IF createdBy IS NULL OR LENGTH(createdBy) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid created by parameter';
   END IF;

   SET division = TRIM(division);
   IF division IS NULL OR LENGTH(division) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid division parameter';
   END IF;

   SET name = TRIM(name);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;

   SET nameClass = TRIM(nameClass);
   IF nameClass IS NULL OR LENGTH(nameClass) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class parameter';
   END IF;
	
	SET rankName = REPLACE(TRIM(rankName), ' ', '_');
	IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
      SET rankName = "no_rank";
   END IF;
	
	SET taxonomyDB = TRIM(taxonomyDB);
	IF taxonomyDB IS NULL OR LENGTH(taxonomyDB) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy DB parameter';
   END IF;
   
   /*IF taxonomyID IS NULL OR taxonomyID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy ID parameter';
   END IF;*/
	
	
	-- Lookup term IDs
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

   SET type = TRIM(type);
   IF type IS NULL OR LENGTH(type) < 1 THEN
      SET typeTID = NULL;
   ELSE 
      SET typeTID = (SELECT id FROM term WHERE full_key = CONCAT('curated_name_type.', type) LIMIT 1);
      IF typeTID IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid curated name type term ID';
      END IF;
   END IF;

   -- Generate a new UUID.
   SET uid = UNHEX(REPLACE(UUID(), '-', ''));


   -- Insert the new curated name.
   INSERT INTO curated_name (
      created_by,
      division_tid,
      ictv_id,
      ictv_taxnode_id,
      name,
      name_class_tid,
      rank_name_tid,
      taxonomy_db_tid,
      taxonomy_id,
      type_tid,
      uid,
      version_id
   ) VALUES (
      createdBy,
      divisionTID,
      ictvID,
      ictvTaxnodeID,
      name,
      nameClassTID,
      rankNameTID,
      taxonomyDbTID,
      taxonomyID,
      typeTID,
      uid,
      versionID
   );


END//
DELIMITER ;
