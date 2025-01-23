
DROP PROCEDURE IF EXISTS `UpdateNcbiNonScientificNames`;

DELIMITER //

CREATE PROCEDURE UpdateNcbiNonScientificNames()
BEGIN

   DECLARE ncbiTaxDbTID INT;
   DECLARE sciNameTID INT;


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


   -- Update non-scientific NCBI non-scientific names with ICTV IDs and taxnode IDs from NCBI scientific names.
   UPDATE searchable_taxon sci 
   JOIN searchable_taxon nonSci ON sci.taxonomy_id = nonSci.taxonomy_id
   SET nonSci.ictv_id = sci.ictv_id,
      nonSci.ictv_taxnode_id = sci.ictv_taxnode_id
   WHERE sci.taxonomy_db_tid = ncbiTaxDbTID
   AND nonSci.taxonomy_db_tid = ncbiTaxDbTID
   AND sci.name_class_tid = sciNameTID
   AND nonSci.name_class_tid <> sciNameTID
   AND sci.ictv_id IS NOT NULL
   AND sci.ictv_taxnode_id IS NOT NULL
   AND nonSci.ictv_id IS NULL
   AND nonSci.ictv_taxnode_id IS NULL;

END //

DELIMITER ;
