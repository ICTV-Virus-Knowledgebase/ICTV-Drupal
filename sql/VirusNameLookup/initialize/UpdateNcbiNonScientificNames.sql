
DROP PROCEDURE IF EXISTS `UpdateNcbiNonScientificNames`;

DELIMITER //

CREATE PROCEDURE UpdateNcbiNonScientificNames()
BEGIN

   DECLARE done INT DEFAULT FALSE;
   DECLARE ictvID INT;
   DECLARE ictvTaxnodeID INT;
   DECLARE ncbiTaxDbTID INT;
   DECLARE rankName VARCHAR(50);
   DECLARE sciName VARCHAR(300);
   DECLARE sciNameTID INT;
   DECLARE taxonomyID INT;

   DECLARE cur CURSOR FOR 

      SELECT st.ictv_id,
         st.ictv_taxnode_id,
         st.`name`,
         t.term_key AS rank_name,
         st.taxonomy_id

      FROM searchable_taxon st
      JOIN term t ON t.id = st.rank_name_tid
      WHERE st.taxonomy_db_tid = ncbiTaxDbTID
      AND st.name_class_tid = sciNameTID
      AND st.ictv_id IS NOT NULL
      AND st.ictv_taxnode_id IS NOT NULL

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   -- Lookup the term ID for the NCBI taxonomy database.
   SET ncbiTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for taxonomy_db.ncbi_taxonomy';
   END IF;

   -- Lookup the term ID for the name class "scientific name".
   SET sciNameTID = (SELECT id FROM term WHERE full_key = 'name_class.scientific_name' LIMIT 1);
   IF sciNameTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for name_class.scientific_name';
   END IF;


   OPEN cur;

   read_loop: LOOP

      FETCH cur INTO ictvID, ictvTaxnodeID, sciName, rankName, taxonomyID;

      IF done THEN
         LEAVE read_loop;
      END IF;

      UPDATE searchable_taxon SET
         ictv_id = ictvID,
         ictv_taxnode_id = ictvTaxnodeID,
         intermediate_name = sciName,
         intermediate_rank = rankName

      WHERE taxonomy_db_tid = ncbiTaxDbTID
      AND name_class_tid <> sciNameTID
      AND taxonomy_id = taxonomyID;

   END LOOP;

   CLOSE cur;

   /*
   -- Update non-scientific names
   UPDATE searchable_taxon otherNames

   -- Join with scientific names that have the same taxonomy database and ID (tax_id).
   JOIN searchable_taxon sciName ON (
      sciName.taxonomy_id = otherNames.taxonomy_id
      AND sciName.taxonomy_db_tid = otherNames.taxonomy_db_tid
   )

   SET otherNames.ictv_id = sciName.ictv_id,
      otherNames.ictv_taxnode_id = sciName.ictv_taxnode_id,
      otherNames.intermediate_name = sciName.name,
      otherNames.intermediate_rank = sciName.rank_name

   -- Scientific names from NCBI Taxonomy
   WHERE sciName.taxonomy_db_tid = ncbiTaxDbTID
   AND sciName.name_class_tid = sciNameTID

   -- Non-scientific names from NCBI Taxonomy
   AND otherNames.taxonomy_db_tid = ncbiTaxDbTID
   AND otherNames.name_class_tid <> sciNameTID;
   */

END //

DELIMITER ;
