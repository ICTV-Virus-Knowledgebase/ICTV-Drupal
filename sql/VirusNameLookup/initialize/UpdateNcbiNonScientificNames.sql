
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


   -- Update non-scientific names
   UPDATE searchable_taxon otherNames

   -- Join with scientific names that have the same taxonomy ID (tax_id).
   JOIN searchable_taxon sciName ON sciName.taxonomy_id = otherNames.taxonomy_id

   SET otherNames.ictv_id = sciName.ictv_id,
      otherNames.ictv_taxnode_id = sciName.ictv_taxnode_id,
      otherNames.intermediate_name = sciName.name,
      otherNames.intermediate_rank = (SELECT label FROM term WHERE full_key = CONCAT("taxonomy_rank.", otherNames.rank_name_tid))

   -- Scientific names from NCBI Taxonomy
   WHERE sciName.taxonomy_db_tid = ncbiTaxDbTID
   AND sciName.name_class_tid = sciNameTID

   -- Non-scientific names from NCBI Taxonomy
   AND otherNames.taxonomy_db_tid = ncbiTaxDbTID
   AND otherNames.name_class_tid <> sciNameTID;

END //

DELIMITER ;
