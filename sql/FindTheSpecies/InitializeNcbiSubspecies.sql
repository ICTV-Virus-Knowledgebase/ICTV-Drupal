
DROP PROCEDURE IF EXISTS `InitializeNcbiSubspecies`;

DELIMITER //

-- For all NCBI subspecies nodes, try to update the subspecies_parent_tax_id column with the lowest 
-- level parent node that has a rank of species or above. 
CREATE PROCEDURE InitializeNcbiSubspecies()
BEGIN

   -- Update the ncbi_node table with a subspecies' parent tax_id.
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
            CASE WHEN n1_node.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END AS n1_is_taxa,
            
            n2_node.tax_id AS n2_tax_id,
            CASE WHEN n2_node.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END AS n2_is_taxa,
            
            n3_node.tax_id AS n3_tax_id,
            CASE WHEN n3_node.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END AS n3_is_taxa,
            
            n4_node.tax_id AS n4_tax_id,
            CASE WHEN n4_node.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END AS n4_is_taxa

         FROM ncbi_name n0_name
         JOIN ncbi_node n0_node ON n0_node.tax_id = n0_name.tax_id

         JOIN ncbi_node n1_node ON n1_node.tax_id = n0_node.parent_tax_id
         JOIN ncbi_name n1_name ON (
            n1_name.tax_id = n1_node.tax_id
            AND n1_name.name_class = 'scientific name'
         )

         LEFT JOIN ncbi_node n2_node ON n2_node.tax_id = n1_node.parent_tax_id 
         LEFT JOIN ncbi_name n2_name ON (
            n2_name.tax_id = n2_node.tax_id
            AND n2_name.name_class = 'scientific name'
         )

         LEFT JOIN ncbi_node n3_node ON n3_node.tax_id = n2_node.parent_tax_id
         LEFT JOIN ncbi_name n3_name ON (
            n3_name.tax_id = n3_node.tax_id
            AND n3_name.name_class = 'scientific name'
         )

         LEFT JOIN ncbi_node n4_node ON n4_node.tax_id = n3_node.parent_tax_id
         LEFT JOIN ncbi_name n4_name ON (
            n4_name.tax_id = n4_node.tax_id
            AND n4_name.name_class = 'scientific name'
         )

         -- Only include phages and viruses.
         WHERE n0_node.division_id IN (3, 9)
         AND n0_name.name_class = 'scientific name'

         -- Only ranks below species.
         AND n0_node.rank_name IN ('genotype','isolate','no rank','serogroup','serotype', 'subspecies')

      ) intermediate_results

   ) lookup ON lookup.tax_id = subspecies.tax_id

   SET subspecies.subspecies_parent_tax_id = lookup.parent_tax_id

   -- Only include phages and viruses.
   WHERE subspecies.division_id IN (3, 9)

   -- Only ranks below species.
   AND subspecies.rank_name IN ('genotype','isolate','no rank','serogroup','serotype', 'subspecies');


END //

DELIMITER ;

