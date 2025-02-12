
DROP PROCEDURE IF EXISTS `DeleteCuratedName`;


DELIMITER //

CREATE PROCEDURE DeleteCuratedName(
   IN `uid_` VARCHAR(100)
)
BEGIN

   DECLARE curatedNameID INT;
   DECLARE ictvCurationTaxDbTID INT;

   -- Validate the input parameter.
   SET uid_ = TRIM(uid_);
   IF uid_ IS NULL OR LENGTH(uid_) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid uid parameter';
   END IF;

   -- Lookup term ID(s)
   SET ictvCurationTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_curation' LIMIT 1);
   IF ictvCurationTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy db term ID for ictv_curation';
   END IF;

   -- Lookup the curated name ID for this uid.
   SELECT id INTO curatedNameID
   FROM curated_name
   WHERE `uid` = UNHEX(uid_);

   -- Validate the curated name ID.
   IF curatedNameID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No curated name was found for the uid provided.';
   END IF;

   -- Delete the corresponding entry in searchable_taxon.
   DELETE FROM searchable_taxon 
   WHERE taxonomy_db_tid = ictvCurationTaxDbTID
   AND taxonomy_id = curatedNameID;

   -- Delete the curated name.
   DELETE FROM curated_name WHERE id = curatedNameID;
   
END//
DELIMITER ;
