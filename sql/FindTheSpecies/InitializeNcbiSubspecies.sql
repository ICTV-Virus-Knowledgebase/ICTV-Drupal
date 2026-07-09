
DROP PROCEDURE IF EXISTS `InitializeNcbiSubspecies`;

DELIMITER //

-- For all NCBI subspecies nodes, try to update the subspecies_parent_tax_id column with the lowest 
-- level parent node that has a rank of species or above. 
CREATE PROCEDURE InitializeNcbiSubspecies()
BEGIN

   /*
   Notes

	1. The view v_subspecies_name_classes returns 'genotype', 'isolate', 'no rank', 'serogroup', 'serotype', and 'subspecies'.
      If this diminishes performance, it can be replaced with a hard-coded list of name classes in the query below.

   2. The view v_ncbi_ranks_above_subspecies returns all NCBI ranks above subspecies. If this diminishes performance, it 
      can be replaced with a hard-coded list of rank names in the query below.
   */

   -- The division IDs for phages and viruses in the NCBI taxonomy database.
   DECLARE phageDivisionID INT DEFAULT 3;
   DECLARE virusDivisionID INT DEFAULT 9;

   -- The term ID for the "scientific name" name class.
   DECLARE sciNameTID INT;

   SET sciNameTID = (SELECT id FROM term WHERE full_key = 'name_class.scientific_name' LIMIT 1);
   IF sciNameTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for name class "scientific name"';
   END IF;


   -- Update subspecies taxa in the ncbi_node table with the tax ID of the lowest level parent node that has a rank of species or above.
   UPDATE ncbi_node subspecies
   JOIN (
      SELECT 
         tax_id,
         CASE
            WHEN n1_is_taxa = 1 then n1_tax_id
            WHEN n2_is_taxa = 1 then n2_tax_id
            WHEN n3_is_taxa = 1 then n3_tax_id
            WHEN n4_is_taxa = 1 then n4_tax_id
         END AS parent_tax_id

      FROM (
         SELECT
            n0_node.tax_id,
            
            n1_node.tax_id AS n1_tax_id,
            CASE WHEN n1_node.rank_name IN (SELECT rank_name FROM v_ncbi_ranks_above_subspecies) THEN 1 ELSE 0 END AS n1_is_taxa,
            
            n2_node.tax_id AS n2_tax_id,
            CASE WHEN n2_node.rank_name IN (SELECT rank_name FROM v_ncbi_ranks_above_subspecies) THEN 1 ELSE 0 END AS n2_is_taxa,
            
            n3_node.tax_id AS n3_tax_id,
            CASE WHEN n3_node.rank_name IN (SELECT rank_name FROM v_ncbi_ranks_above_subspecies) THEN 1 ELSE 0 END AS n3_is_taxa,
            
            n4_node.tax_id AS n4_tax_id,
            CASE WHEN n4_node.rank_name IN (SELECT rank_name FROM v_ncbi_ranks_above_subspecies) THEN 1 ELSE 0 END AS n4_is_taxa

         FROM ncbi_name n0_name
         JOIN ncbi_node n0_node ON n0_node.tax_id = n0_name.tax_id

         JOIN ncbi_node n1_node ON n1_node.tax_id = n0_node.parent_tax_id
         JOIN ncbi_name n1_name ON (
            n1_name.tax_id = n1_node.tax_id
            AND n1_name.name_class_tid = sciNameTID
         )

         LEFT JOIN ncbi_node n2_node ON n2_node.tax_id = n1_node.parent_tax_id 
         LEFT JOIN ncbi_name n2_name ON (
            n2_name.tax_id = n2_node.tax_id
            AND n2_name.name_class_tid = sciNameTID
         )

         LEFT JOIN ncbi_node n3_node ON n3_node.tax_id = n2_node.parent_tax_id
         LEFT JOIN ncbi_name n3_name ON (
            n3_name.tax_id = n3_node.tax_id
            AND n3_name.name_class_tid = sciNameTID
         )

         LEFT JOIN ncbi_node n4_node ON n4_node.tax_id = n3_node.parent_tax_id
         LEFT JOIN ncbi_name n4_name ON (
            n4_name.tax_id = n4_node.tax_id
            AND n4_name.name_class_tid = sciNameTID
         )

         -- Make sure the subspecies has the name class "scientific name".
         WHERE n0_name.name_class_tid = sciNameTID

         -- Limit to ranks below species.
         AND n0_node.rank_name IN (SELECT name_class FROM v_subspecies_name_classes)
         AND n0_node.division_id IN (phageDivisionID, virusDivisionID)
         AND n1_node.division_id IN (phageDivisionID, virusDivisionID)
         AND n2_node.division_id IN (phageDivisionID, virusDivisionID)
         AND n3_node.division_id IN (phageDivisionID, virusDivisionID)
         AND n4_node.division_id IN (phageDivisionID, virusDivisionID)

      ) intermediate_results

   ) lookup ON lookup.tax_id = subspecies.tax_id

   SET subspecies.subspecies_parent_tax_id = lookup.parent_tax_id

   -- Only include phages and viruses.
   WHERE subspecies.division_id IN (phageDivisionID, virusDivisionID)

   -- Only ranks below species.
   AND subspecies.rank_name IN (SELECT name_class FROM v_subspecies_name_classes);

END //

DELIMITER ;

