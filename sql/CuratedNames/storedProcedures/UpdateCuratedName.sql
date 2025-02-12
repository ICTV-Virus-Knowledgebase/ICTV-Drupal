
DROP PROCEDURE IF EXISTS `UpdateCuratedName`;


DELIMITER //

CREATE PROCEDURE UpdateCuratedName(
   IN `comments` TEXT,
   IN `ictvTaxnodeID` INT,
   IN `name` NVARCHAR(300),
   IN `type` VARCHAR(100),
   IN `uid_` VARCHAR(100)
)
BEGIN
   -- Declare variables used below.
   DECLARE curatedNameID INT;
   DECLARE taxonomyDbTID INT;
   DECLARE typeTID INT;

   -- ======================================================================================================================
   -- Validate the input parameters.
   -- ======================================================================================================================
   SET comments = TRIM(comments);

   SET name = TRIM(name);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
	
   SET type = TRIM(type);
   IF type IS NULL OR LENGTH(type) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid type parameter';
   END IF;

   SET uid_ = TRIM(uid_);
   IF uid_ IS NULL OR LENGTH(uid_) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid uid_ parameter';
   END IF;

   -- TODO: Consider validating a non-null ictv taxnode ID.
   
   -- ======================================================================================================================
   -- Lookup term IDs
   -- ======================================================================================================================
   SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_curation' LIMIT 1);
   IF taxonomyDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy db term ID';
   END IF;

   SET typeTID = (SELECT id FROM term WHERE full_key = CONCAT('curated_name_type.', type) LIMIT 1);
   IF typeTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid curated name type term ID';
   END IF;

   -- Insert the new curated name.
   UPDATE curated_name SET
      comments = comments,
      ictv_taxnode_id = ictvTaxnodeID,
      name = name,
      taxonomy_db_tid = taxonomyDbTID,
      type_tid = typeTID
       
   WHERE `uid` = UNHEX(uid_);


   -- ======================================================================================================================
   -- Get the curated name's ID.
   -- ======================================================================================================================
   SET curatedNameID = (SELECT id FROM curated_name WHERE `uid` = UNHEX(uid_));


   -- ======================================================================================================================
   -- Update searchable_taxon with the updated curated name.
   -- ======================================================================================================================
   CALL UpdateSearchableTaxon(curatedNameID, ictvTaxnodeID, name, type);

END//
DELIMITER ;
