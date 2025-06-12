
DROP PROCEDURE IF EXISTS `GetTaxonHistory`;


DELIMITER //

CREATE PROCEDURE GetTaxonHistory(
	
   -- The current MSL release number.
   IN `currentMSL` INT,

   -- The ICTV ID of the taxon to query.
   IN `ictvID` INT,

   -- The MSL associated with the ICTV ID parameter (optional).
   IN `MSL` INT,

   -- The taxnode ID of the taxon to query.
   IN `taxNodeID` INT,

   -- The taxon name to query.
   IN `taxonName` VARCHAR(300),

   -- The VMR / isolate ID.
   IN `vmrID` INT
)
BEGIN

   DECLARE selectedMSL INT;


   -- Pre-process the input parameters to arrive at a taxnode_id.
   SET taxonName = TRIM(taxonName);

	-- If taxnode_id wasn't provided, use one of the other parameters to lookup an associated taxnode_id. 
	-- Prioritize parameters as follows: taxnode_id, ictv_iv, vmr_id, taxon_name.
	IF taxNodeID IS NULL OR taxNodeID < 1 THEN
		IF ictvID IS NOT NULL AND ictvID > 0 THEN

         -- Find the most recent taxnode_id associated with the ictv_id.
         SELECT tn.taxnode_id INTO taxNodeID
         FROM taxonomy_node_names tn
         WHERE tn.ictv_id = ictvID
         AND (msl IS NULL OR (msl IS NOT NULL AND tn.msl_release_num = msl))
         ORDER BY tn.msl_release_num DESC
         LIMIT 1;

		ELSEIF vmrID IS NOT NULL AND vmrID > 0 THEN

         -- Find the most appropriate taxnode_id associated with the VMR ID.
         SELECT si.taxnode_id INTO taxNodeID
         FROM species_isolates si
         WHERE si.isolate_id = vmrID
         ORDER BY si.isolate_sort ASC
         LIMIT 1;

		ELSEIF taxonName IS NOT NULL AND LENGTH(taxonName) > 0 THEN

         -- Find the most recent taxnode_id associated with the taxon_name.
         SELECT tn.taxnode_id INTO taxNodeID
         FROM taxonomy_node_names tn
         WHERE tn.name = taxonName
         ORDER BY tn.msl_release_num DESC
         LIMIT 1;

		ELSE 
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Either taxnode_id, ictv_id, vmr_id, or taxon_name must be provided';
      END IF;
	END IF;

	-- Did we get a valid taxnode_id?
	IF taxNodeID IS NULL OR taxNodeID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to determine taxnode_id';
   END IF;

   -- Get the MSL of the selected taxon.
   SET selectedMSL = (SELECT tn.msl_release_num FROM taxonomy_node tn WHERE tn.taxnode_id = taxNodeID LIMIT 1);

   WITH taxaChanges AS (
      SELECT
         ictv_id,
         MAX(is_deleted) AS is_deleted,
         MAX(is_demoted) AS is_demoted,
         MAX(is_lineage_updated) AS is_lineage_updated,
         MAX(is_merged) AS is_merged,
         MAX(is_moved) AS is_moved,
         MAX(is_new) AS is_new,
         MAX(is_promoted) AS is_promoted,
         MAX(is_renamed) AS is_renamed,
         MAX(is_split) AS is_split,
         left_idx,
         lineage,
         lineage_ids,
         IFNULL(modifications,0) AS modifications,
         CASE
            WHEN MAX(is_deleted) = 1 THEN msl_release_num + 1
            ELSE msl_release_num
         END AS msl_release_num,
         name,
         MAX(prev_notes) AS prev_notes,
         MAX(prev_proposal) AS prev_proposal,
         taxnode_id
      FROM (
         SELECT 
            node.ictv_id,
            prev_delta.is_deleted,
            prev_delta.is_demoted,
            prev_delta.is_lineage_updated,
            prev_delta.is_merged,
            prev_delta.is_moved,
            prev_delta.is_new,
            prev_delta.is_promoted,
            prev_delta.is_renamed,
            prev_delta.is_split,
            node.left_idx,
            node.lineage,
            CONCAT(
               CASE WHEN node.realm_id IS NOT NULL THEN CONCAT(CAST(node.realm_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subrealm_id IS NOT NULL THEN CONCAT(CAST(node.subrealm_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.kingdom_id IS NOT NULL THEN CONCAT(CAST(node.kingdom_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subkingdom_id IS NOT NULL THEN CONCAT(CAST(node.subkingdom_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.phylum_id IS NOT NULL THEN CONCAT(CAST(node.phylum_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subphylum_id IS NOT NULL THEN CONCAT(CAST(node.subphylum_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.class_id IS NOT NULL THEN CONCAT(CAST(node.class_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subclass_id IS NOT NULL THEN CONCAT(CAST(node.subclass_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.order_id IS NOT NULL THEN CONCAT(CAST(node.order_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.suborder_id IS NOT NULL THEN CONCAT(CAST(node.suborder_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.family_id IS NOT NULL THEN CONCAT(CAST(node.family_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subfamily_id IS NOT NULL THEN CONCAT(CAST(node.subfamily_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.genus_id IS NOT NULL THEN CONCAT(CAST(node.genus_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subgenus_id IS NOT NULL THEN CONCAT(CAST(node.subgenus_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.species_id IS NOT NULL THEN CONCAT(CAST(node.species_id AS CHAR(12)), ';') ELSE '' END	
            ) AS lineage_ids,
            ( 
               prev_delta.is_deleted |
               prev_delta.is_demoted |
               prev_delta.is_lineage_updated |
               prev_delta.is_merged |
               prev_delta.is_moved |
               prev_delta.is_new |
               prev_delta.is_promoted |   
               prev_delta.is_renamed |   
               prev_delta.is_split
            ) AS modifications,
            node.msl_release_num,
            node.name,
            prev_delta.notes AS prev_notes, 
            prev_delta.proposal AS prev_proposal,
            CONCAT(
               CASE WHEN node.realm_id IS NOT NULL THEN 'Realm;' ELSE '' END, 
               CASE WHEN node.subrealm_id IS NOT NULL THEN 'Subrealm;' ELSE '' END, 
               CASE WHEN node.kingdom_id IS NOT NULL THEN 'Kingdom;' ELSE '' END, 
               CASE WHEN node.subkingdom_id IS NOT NULL THEN 'Subkingdom;' ELSE '' END, 
               CASE WHEN node.phylum_id IS NOT NULL THEN 'Phylum;' ELSE '' END, 
               CASE WHEN node.subphylum_id IS NOT NULL THEN 'Subphylum;' ELSE '' END, 
               CASE WHEN node.class_id IS NOT NULL THEN 'Class;' ELSE '' END, 
               CASE WHEN node.subclass_id IS NOT NULL THEN 'Subclass;' ELSE '' END, 
               CASE WHEN node.order_id IS NOT NULL THEN 'Order;' ELSE '' END, 
               CASE WHEN node.suborder_id IS NOT NULL THEN 'Suborder;' ELSE '' END, 
               CASE WHEN node.family_id IS NOT NULL THEN 'Family;' ELSE '' END, 
               CASE WHEN node.subfamily_id IS NOT NULL THEN 'Subfamily;' ELSE '' END, 
               CASE WHEN node.genus_id IS NOT NULL THEN 'Genus;' ELSE '' END, 
               CASE WHEN node.subgenus_id IS NOT NULL THEN 'Subgenus;' ELSE '' END, 
               CASE WHEN node.species_id IS NOT NULL THEN 'Species;' ELSE '' END 
            ) AS rank_names,
            node.taxnode_id AS taxnode_id,  
            node.tree_id AS tree_id

         FROM taxonomy_node_x AS node  
         LEFT JOIN taxonomy_node_delta AS prev_delta ON prev_delta.new_taxid = node.taxnode_id
         WHERE node.tree_id >= 19000000
         AND node.msl_release_num <= currentMSL 
         AND node.target_taxnode_id = taxNodeID

         UNION ALL

         SELECT 
            node.ictv_id,
            prev_delta.is_deleted,
            prev_delta.is_demoted,
            prev_delta.is_lineage_updated,
            prev_delta.is_merged,
            prev_delta.is_moved,
            prev_delta.is_new,
            prev_delta.is_promoted,
            prev_delta.is_renamed,
            prev_delta.is_split,
            node.left_idx,
            node.lineage,
            CONCAT(
               CASE WHEN node.realm_id IS NOT NULL THEN CONCAT(CAST(node.realm_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subrealm_id IS NOT NULL THEN CONCAT(CAST(node.subrealm_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.kingdom_id IS NOT NULL THEN CONCAT(CAST(node.kingdom_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subkingdom_id IS NOT NULL THEN CONCAT(CAST(node.subkingdom_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.phylum_id IS NOT NULL THEN CONCAT(CAST(node.phylum_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subphylum_id IS NOT NULL THEN CONCAT(CAST(node.subphylum_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.class_id IS NOT NULL THEN CONCAT(CAST(node.class_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subclass_id IS NOT NULL THEN CONCAT(CAST(node.subclass_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.order_id IS NOT NULL THEN CONCAT(CAST(node.order_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.suborder_id IS NOT NULL THEN CONCAT(CAST(node.suborder_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.family_id IS NOT NULL THEN CONCAT(CAST(node.family_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subfamily_id IS NOT NULL THEN CONCAT(CAST(node.subfamily_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.genus_id IS NOT NULL THEN CONCAT(CAST(node.genus_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.subgenus_id IS NOT NULL THEN CONCAT(CAST(node.subgenus_id AS CHAR(12)), ';') ELSE '' END, 
               CASE WHEN node.species_id IS NOT NULL THEN CONCAT(CAST(node.species_id AS CHAR(12)), ';') ELSE '' END	
            ) AS lineage_ids,
            ( 
               prev_delta.is_deleted |
               prev_delta.is_demoted |
               prev_delta.is_lineage_updated |
               prev_delta.is_merged |
               prev_delta.is_moved |
               prev_delta.is_new |
               prev_delta.is_promoted |   
               prev_delta.is_renamed |   
               prev_delta.is_split
            ) AS modifications,
            node.msl_release_num,
            node.name,
            prev_delta.notes AS prev_notes, 
            prev_delta.proposal AS prev_proposal,
            CONCAT(
               CASE WHEN node.realm_id IS NOT NULL THEN 'Realm;' ELSE '' END, 
               CASE WHEN node.subrealm_id IS NOT NULL THEN 'Subrealm;' ELSE '' END, 
               CASE WHEN node.kingdom_id IS NOT NULL THEN 'Kingdom;' ELSE '' END, 
               CASE WHEN node.subkingdom_id IS NOT NULL THEN 'Subkingdom;' ELSE '' END, 
               CASE WHEN node.phylum_id IS NOT NULL THEN 'Phylum;' ELSE '' END, 
               CASE WHEN node.subphylum_id IS NOT NULL THEN 'Subphylum;' ELSE '' END, 
               CASE WHEN node.class_id IS NOT NULL THEN 'Class;' ELSE '' END, 
               CASE WHEN node.subclass_id IS NOT NULL THEN 'Subclass;' ELSE '' END, 
               CASE WHEN node.order_id IS NOT NULL THEN 'Order;' ELSE '' END, 
               CASE WHEN node.suborder_id IS NOT NULL THEN 'Suborder;' ELSE '' END, 
               CASE WHEN node.family_id IS NOT NULL THEN 'Family;' ELSE '' END, 
               CASE WHEN node.subfamily_id IS NOT NULL THEN 'Subfamily;' ELSE '' END, 
               CASE WHEN node.genus_id IS NOT NULL THEN 'Genus;' ELSE '' END, 
               CASE WHEN node.subgenus_id IS NOT NULL THEN 'Subgenus;' ELSE '' END, 
               CASE WHEN node.species_id IS NOT NULL THEN 'Species;' ELSE '' END 
            ) AS rank_names,
            node.taxnode_id AS taxnode_id,  
            node.tree_id AS tree_id
         FROM taxonomy_node_x AS node  
         JOIN taxonomy_node_delta AS prev_delta ON (
            prev_delta.is_deleted = 1 
            AND prev_delta.prev_taxid = node.target_taxnode_id
         )
         WHERE node.tree_id >= 19000000
         AND node.msl_release_num <= currentMSL 
         AND node.target_taxnode_id = taxNodeID
      ) taxaAndPrevs

      GROUP BY taxaAndPrevs.msl_release_num, taxaAndPrevs.taxnode_id, taxaAndPrevs.tree_id, taxaAndPrevs.name, taxaAndPrevs.ictv_id, 
         taxaAndPrevs.is_deleted, taxaAndPrevs.is_demoted, taxaAndPrevs.is_lineage_updated, taxaAndPrevs.is_merged, 
         taxaAndPrevs.is_moved, taxaAndPrevs.is_new, taxaAndPrevs.is_promoted, taxaAndPrevs.is_renamed, taxaAndPrevs.is_split,
         taxaAndPrevs.left_idx, taxaAndPrevs.lineage, taxaAndPrevs.lineage_ids, taxaAndPrevs.modifications, taxaAndPrevs.msl_release_num, 
         taxaAndPrevs.name, taxaAndPrevs.prev_notes, taxaAndPrevs.prev_proposal
   )

   SELECT limitedTaxa.*, 
      
      -- The parent of the previous version of the taxon.
      prev_parent_rank.name AS prev_parent_rank,
      prev_parent_name.name AS prev_parent_name,
      
      -- Names of this taxon's antecedents from the previous release.
      CASE
         WHEN limitedTaxa.is_deleted = 0 AND (limitedTaxa.is_merged = 1 OR limitedTaxa.is_renamed = 1 OR limitedTaxa.is_split = 1) THEN

            -- Format the previous names as a comma-delimited list.
            (SELECT GROUP_CONCAT(tn_previous.name ORDER BY tn_previous.left_idx SEPARATOR ', ')
            FROM taxonomy_node tn_changed
            JOIN taxonomy_node_merge_split ms_changed ON ms_changed.prev_ictv_id = tn_changed.ictv_id
            JOIN taxonomy_node tn_previous ON tn_previous.ictv_id = ms_changed.next_ictv_id
            JOIN taxonomy_node_delta delta_previous ON (
               delta_previous.new_taxid = tn_changed.taxnode_id
               AND delta_previous.prev_taxid = tn_previous.taxnode_id
            )
            WHERE tn_changed.taxnode_id = limitedTaxa.taxnode_id
            AND tn_previous.msl_release_num = (limitedTaxa.msl_release_num - 1)
            -- ORDER BY tn_previous.left_idx
            )
         ELSE NULL
      END AS previous_names,
      CONCAT(
         CASE WHEN realms > 0 THEN 'realm,' ELSE '' END,  
         CASE WHEN subrealms > 0 THEN 'subrealm,' ELSE '' END,  
         CASE WHEN kingdoms > 0 THEN 'kingdom,' ELSE '' END,  
         CASE WHEN subkingdoms > 0 THEN 'subkingdom,' ELSE '' END,  
         CASE WHEN phyla > 0 THEN 'phylum,' ELSE '' END,  
         CASE WHEN subphyla > 0 THEN 'subphylum,' ELSE '' END,  
         CASE WHEN classes > 0 THEN 'class,' ELSE '' END,  
         CASE WHEN subclasses > 0 THEN 'subclass,' ELSE '' END,  
         CASE WHEN orders > 0 THEN 'order,' ELSE '' END,  
         CASE WHEN suborders > 0 THEN 'suborder,' ELSE '' END,  
         CASE WHEN families > 0 THEN 'family,' ELSE '' END,  
         CASE WHEN subfamilies > 0 THEN 'subfamily,' ELSE '' END,  
         CASE WHEN genera > 0 THEN 'genus,' ELSE '' END,  
         CASE WHEN subgenera > 0 THEN 'subgenus,' ELSE '' END,  
         CASE WHEN msl.species > 0 THEN 'species' ELSE '' END  
      ) AS release_rank_names, 
      SUBSTRING(msl.notes, 1, 255) AS release_title,  
      msl.year AS release_year

   FROM (
      SELECT *
      FROM taxaChanges tc1
      WHERE tc1.msl_release_num IN (
         SELECT msl_release_num
         FROM (
            -- Releases with at least one modification.
            SELECT tc2.msl_release_num, SUM(tc2.modifications) AS mods 
            FROM taxaChanges tc2
            GROUP BY tc2.msl_release_num

            -- Include the current release if there are taxa associated with it. 
            UNION ALL

            SELECT CASE
               WHEN EXISTS (
                  SELECT 1
                  FROM taxaChanges currentTaxa
                  WHERE currentTaxa.msl_release_num = currentMSL
               ) THEN currentMSL
               ELSE NULL
            END AS msl_release_num, 
            1 AS mods
         ) releases
         WHERE mods > 0
         AND msl_release_num IS NOT NULL
      )
   ) limitedTaxa

   -- Include the previous version for demoted, moved, and promoted taxa.
   LEFT JOIN taxonomy_node prev_tn ON (
      (is_demoted = 1 OR is_lineage_updated = 1 OR is_moved = 1 OR is_promoted = 1)
      AND prev_tn.ictv_id = limitedTaxa.ictv_id
      AND prev_tn.msl_release_num = limitedTaxa.msl_release_num - 1
   )

   -- The parent of the previous version of the taxon.
   LEFT JOIN taxonomy_node prev_parent_name ON (
      (is_lineage_updated = 1 OR is_moved = 1)
      AND prev_tn.taxnode_id IS NOT NULL
      AND prev_parent_name.taxnode_id = prev_tn.parent_id
   )
   LEFT JOIN taxonomy_level prev_parent_rank ON (
      prev_parent_name.taxnode_id IS NOT NULL
      AND prev_parent_rank.id = prev_parent_name.level_id
   )

   -- MSL releases
   JOIN view_taxa_level_counts_by_release msl ON msl.msl_release_num = limitedTaxa.msl_release_num

   ORDER BY 

      -- Sort by release
      limitedTaxa.msl_release_num DESC,

      -- Sort the name alphabetically
      limitedTaxa.left_idx ASC,

      -- The order of changes is New, Abolished, Promoted, Demoted, Merged, Split, Moved, Lineage updated, Renamed, and Unchanged.
      is_new DESC,
      limitedTaxa.is_deleted DESC,
      is_promoted DESC,
      is_demoted DESC,
      is_merged DESC,
      is_split DESC,
      is_moved DESC, 
      is_lineage_updated DESC,
      is_renamed DESC;

END//
DELIMITER ;