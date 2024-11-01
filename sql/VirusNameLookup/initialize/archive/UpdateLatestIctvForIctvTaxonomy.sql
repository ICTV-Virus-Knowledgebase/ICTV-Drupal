
DELIMITER //

DROP PROCEDURE IF EXISTS `updateLatestIctvForIctvTaxonomy`;

CREATE PROCEDURE `updateLatestIctvForIctvTaxonomy`()
BEGIN

   DECLARE ictvTaxDbTID INT;

   SET ictvTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_taxonomy' LIMIT 1);
   IF ictvTaxDbTID IS NULL OR ictvTaxDbTID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for ICTV taxonomy DB';
   END IF;


   -- Update the columns for the latest ICTV MSL, rank, and taxnode ID.
   UPDATE taxon_name SET
      ictv_msl_release = version_id,
      ictv_rank_name = rank_name,
      ictv_taxnode_id = taxnode_id
   WHERE taxonomy_db_tid = ictvTaxDbTID;

END//
DELIMITER ;