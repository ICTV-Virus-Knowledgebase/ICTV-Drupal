
DROP PROCEDURE IF EXISTS `InitializeDiseaseOntology`;

DELIMITER //

-- Try to update disease_ontology records with a matching ICTV ID and ICTV taxnode ID.
CREATE PROCEDURE InitializeDiseaseOntology()
BEGIN

   -- Update the disease_ontology table with the current ICTV ID and ICTV taxnode ID.
   UPDATE disease_ontology d

   -- Join searchable_taxon on the NCBI tax ID.
   JOIN v_searchable_taxon st ON (
      d.ncbi_taxid = st.taxonomy_id
      AND st.taxonomy_db = 'ncbi_taxonomy'
      AND st.name_class = 'scientific_name'
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

