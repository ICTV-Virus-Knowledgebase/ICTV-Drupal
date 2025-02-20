
DROP PROCEDURE IF EXISTS `InitializeDiseaseOntology`;

DELIMITER //

-- Try to update disease_ontology records with a matching ICTV ID and ICTV taxnode ID.
CREATE PROCEDURE InitializeDiseaseOntology()
BEGIN

   DECLARE sciNameClassTID INT;
   DECLARE ncbiTaxonomyDbTID INT;

   -- Lookup term IDs
   SET sciNameClassTID = (SELECT id FROM term WHERE full_key = 'name_class.scientific_name' LIMIT 1);
   IF sciNameClassTID IS NULL THEN 
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for name class "scientific_name"';
   END IF;

   SET ncbiTaxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxonomyDbTID IS NULL THEN 
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for NCBI Taxonomy DB';
   END IF;


   -- Update the disease_ontology table with the current ICTV ID and ICTV taxnode ID.
   UPDATE disease_ontology d

   -- Join searchable_taxon on the NCBI tax ID.
   JOIN searchable_taxon st ON (
      d.ncbi_taxid = st.taxonomy_id
      AND st.taxonomy_db_tid = ncbiTaxonomyDbTID
      AND st.name_class_tid = sciNameClassTID
   )
   LEFT JOIN v_taxonomy_node_merge_split ms ON (
      ms.prev_ictv_id = st.ictv_id 
      AND ms.rev_count = 0
   )
   LEFT JOIN latest_release_of_ictv_id lr_result ON lr_result.ictv_id = ms.next_ictv_id 
   LEFT JOIN v_taxonomy_node_names result_tn ON (
      result_tn.ictv_id = ms.next_ictv_id 
      AND result_tn.msl_release_num = lr_result.latest_msl_release
   ) 
   SET d.ictv_id = result_tn.ictv_id, 
       d.ictv_taxnode_id = result_tn.taxnode_id;

END //

DELIMITER ;

