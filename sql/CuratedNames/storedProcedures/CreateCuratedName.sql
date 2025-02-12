
DROP PROCEDURE IF EXISTS `CreateCuratedName`;


DELIMITER //

CREATE PROCEDURE CreateCuratedName(
   IN `comments` TEXT,
   IN `createdBy` VARCHAR(100),
   IN `ictvTaxnodeID` INT,
   IN `name_` NVARCHAR(300),
   IN `type` VARCHAR(100),
   IN `versionID` INT
)
BEGIN
   -- Declare variables used below.
   DECLARE curatedNameID INT;
   DECLARE taxonomyDbTID INT;
   DECLARE typeTID INT;
   DECLARE uid BINARY(16);

   -- ======================================================================================================================
   -- Validate the input parameters.
   -- ======================================================================================================================
   SET comments = TRIM(comments);

   SET createdBy = TRIM(createdBy);
   IF createdBy IS NULL OR LENGTH(createdBy) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid created by parameter';
   END IF;

   SET name_ = TRIM(name_);
   IF name_ IS NULL OR LENGTH(name_) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
	
   -- ======================================================================================================================
   -- Is there already a curated name record with this name?
   -- ======================================================================================================================
   IF EXISTS (SELECT 1 FROM curated_name WHERE name = name_) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A curated name with this name already exists';
   END IF;

   SET type = TRIM(type);
   IF type IS NULL OR LENGTH(type) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid type parameter';
   END IF;

   -- TODO: Consider validating a non-null ictv taxnode ID.
   
   SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_curation' LIMIT 1);
   IF taxonomyDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy db term ID';
   END IF;

   -- ======================================================================================================================
	-- Lookup term ID(s)
   -- ======================================================================================================================
   SET typeTID = (SELECT id FROM term WHERE full_key = CONCAT('curated_name_type.', type) LIMIT 1);
   IF typeTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid curated name type term ID';
   END IF;

   -- ======================================================================================================================
   -- Generate a new UUID.
   -- ======================================================================================================================
   SET uid = UNHEX(REPLACE(UUID(), '-', ''));


   -- ======================================================================================================================
   -- Insert the new curated name.
   -- ======================================================================================================================
   INSERT INTO curated_name (
      comments,
      created_by,
      ictv_taxnode_id,
      `name`,
      taxonomy_db_tid,
      type_tid,
      uid,
      version_id
   ) VALUES (
      comments,
      createdBy,
      ictvTaxnodeID,
      name_,
      taxonomyDbTID,
      typeTID,
      uid,
      versionID
   );

   -- ======================================================================================================================
   -- Get the auto-incremented id column value of the record that was just inserted.
   -- ======================================================================================================================
   SET curatedNameID = (SELECT LAST_INSERT_ID());
   IF curatedNameID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to retrieve the curated name ID';
   END IF;

   -- ======================================================================================================================
   -- Update searchable_taxon with the updated curated name.
   -- ======================================================================================================================
   CALL UpdateSearchableTaxon(curatedNameID, ictvTaxnodeID, name_, type);

END//
DELIMITER ;
