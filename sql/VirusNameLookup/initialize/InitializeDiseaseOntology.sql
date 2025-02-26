
DROP PROCEDURE IF EXISTS `InitializeDiseaseOntology`;

DELIMITER //

-- Try to update disease_ontology records with a matching ICTV ID and ICTV taxnode ID.
CREATE PROCEDURE InitializeDiseaseOntology()
BEGIN

   DECLARE done BOOLEAN DEFAULT FALSE;
   DECLARE ictvID INT;
   DECLARE ictvTaxnodeID INT;
   DECLARE _id BIGINT UNSIGNED;
   DECLARE ncbiTaxonomyDbTID INT;
   DECLARE possibleName VARCHAR(300);
   DECLARE sciNameClassTID INT;
   
   -- ======================================================================================================================
   -- Update disease_ontology records with a "possible name".
   -- ======================================================================================================================
   DECLARE nameCursor CURSOR FOR 
         SELECT `id`, possible_name
         FROM disease_ontology
         WHERE possible_name IS NOT NULL AND ncbi_taxid IS NULL;

      DECLARE CONTINUE HANDLER FOR NOT FOUND SET done := TRUE;

      OPEN nameCursor;

      nameLoop: LOOP
         FETCH nameCursor INTO _id, possibleName;
         IF done THEN
            LEAVE nameLoop;
         END IF;

         -- Find the best searchable_taxon match for the "possible name".
         SELECT st.ictv_id, st.ictv_taxnode_id INTO ictvID, ictvTaxnodeID
         FROM v_searchable_taxon st
         WHERE st.name = possibleName
         AND st.ictv_id IS NOT NULL
         AND st.ictv_taxnode_id IS NOT NULL
         AND st.taxonomy_db <> 'disease_ontology'
         ORDER BY CASE
            WHEN st.taxonomy_db IN ('ictv_taxonomy', 'ictv_vmr') THEN 1
            WHEN st.taxonomy_db = 'ictv_curation' THEN 2
            WHEN st.taxonomy_db = 'ncbi_taxonomy' THEN 3
            ELSE 3
         END ASC
         LIMIT 1;

         IF ictvID IS NOT NULL AND ictvTaxnodeID IS NOT NULL THEN

            -- Update the disease ontology record with the ICTV ID and taxnode ID.
            UPDATE disease_ontology SET ictv_id = ictvID, ictv_taxnode_id = ictvTaxnodeID
            WHERE `id` = _id;
         END IF;

      END LOOP nameLoop;

   CLOSE nameCursor; 


   -- Lookup term IDs
   SET sciNameClassTID = (SELECT id FROM term WHERE full_key = 'name_class.scientific_name' LIMIT 1);
   IF sciNameClassTID IS NULL THEN 
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for name class "scientific_name"';
   END IF;

   SET ncbiTaxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxonomyDbTID IS NULL THEN 
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for NCBI Taxonomy DB';
   END IF;


   -- ======================================================================================================================
   -- Update disease_ontology records with an NCBI name and tax_id.
   -- ======================================================================================================================
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
       d.ictv_taxnode_id = result_tn.taxnode_id
   WHERE d.ncbi_taxid IS NOT NULL AND d.ncbi_name IS NOT NULL;

END //

DELIMITER ;

