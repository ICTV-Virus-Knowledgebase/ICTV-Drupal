
DROP PROCEDURE IF EXISTS `GetTaxonReleaseHistory`;


DELIMITER //

CREATE PROCEDURE GetTaxonReleaseHistory(
	
   -- The current MSL release number.
   IN `currentMslRelease` INT,

   -- The ICTV ID of the taxon to query.
   IN `ictvID` INT,

   -- The taxnode ID of the taxon to query.
   IN `taxnodeID` INT
)
BEGIN

   DECLARE abolishedTreeID INT;
   DECLARE lastTreeID INT;




   -- If an ictvID was provided, use it to get the current taxnodeID.
   IF ictvID IS NOT NULL AND ictvID > 0 THEN
      SET taxnodeID = (
         SELECT result_tn.taxnode_id
         FROM taxonomy_node_merge_split ms 
         LEFT JOIN taxonomy_node result_tn ON result_tn.ictv_id = ms.next_ictv_id
         WHERE ms.prev_ictv_id = ictvID
         AND ms.rev_count = 0
         ORDER BY result_tn.msl_release_num DESC
         LIMIT 1
      );
   END IF;

   IF taxnodeID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxnodeID';
   END IF;

   
   -- Query 1: Get taxon info associated with the selected taxnode ID.
   SELECT 
      tn_selected.lineage AS lineage,
      tn_selected.msl_release_num,
      tl_selected.name AS rank_name, 
      CONCAT(
         CASE WHEN tn_selected.realm_id IS NOT NULL THEN 'Realm;' ELSE '' END,
         CASE WHEN tn_selected.subrealm_id IS NOT NULL THEN 'Subrealm;' ELSE '' END,
         CASE WHEN tn_selected.kingdom_id IS NOT NULL THEN 'Kingdom;' ELSE '' END,
         CASE WHEN tn_selected.subkingdom_id IS NOT NULL THEN 'Subkingdom;' ELSE '' END,
         CASE WHEN tn_selected.phylum_id IS NOT NULL THEN 'Phylum;' ELSE '' END,
         CASE WHEN tn_selected.subphylum_id IS NOT NULL THEN 'Subphylum;' ELSE '' END,
         CASE WHEN tn_selected.class_id IS NOT NULL THEN 'Class;' ELSE '' END,
         CASE WHEN tn_selected.subclass_id IS NOT NULL THEN 'Subclass;' ELSE '' END,
         CASE WHEN tn_selected.order_id IS NOT NULL THEN 'Order;' ELSE '' END,
         CASE WHEN tn_selected.suborder_id IS NOT NULL THEN 'Suborder;' ELSE '' END,
         CASE WHEN tn_selected.family_id IS NOT NULL THEN 'Family;' ELSE '' END,
         CASE WHEN tn_selected.subfamily_id IS NOT NULL THEN 'Subfamily;' ELSE '' END,
         CASE WHEN tn_selected.genus_id IS NOT NULL THEN 'Genus;' ELSE '' END,
         CASE WHEN tn_selected.subgenus_id IS NOT NULL THEN 'Subgenus;' ELSE '' END,
         CASE WHEN tn_selected.species_id IS NOT NULL THEN 'Species;' ELSE '' END
      ) AS rank_names,
      tn_selected.taxnode_id AS taxnode_id, 
      tn_selected.name AS taxon_name,
      tn_selected.tree_id

   FROM taxonomy_node tn_selected 
   JOIN taxonomy_level tl_selected ON tl_selected.id = tn_selected.level_id 
   WHERE tn_selected.taxnode_id = taxnodeID
   LIMIT 1;


   -- Query 1a: If the taxon has been abolished, get the tree ID of the release before it was abolished,
   -- and the tree ID of the release where it was actually abolished.
   SELECT toc.tree_id, node.tree_id INTO abolishedTreeID, lastTreeID
   FROM taxonomy_node_x AS node
   JOIN taxonomy_toc toc ON toc.msl_release_num = node.msl_release_num + 1
   JOIN taxonomy_node_delta next_delta ON next_delta.prev_taxid = node.taxnode_id 
   WHERE node.tree_id >= 19000000
   AND node.msl_release_num <= currentMslRelease
   AND node.is_deleted = 0 AND node.is_hidden = 0   
   AND node.target_taxnode_id = taxNodeID
   AND next_delta.is_deleted = 1;

   select abolishedTreeID, lastTreeID;

	
END//
DELIMITER ;