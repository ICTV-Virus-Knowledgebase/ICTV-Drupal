
DROP PROCEDURE IF EXISTS `GetTreeExpandedToNode`;

DELIMITER //

CREATE PROCEDURE GetTreeExpandedToNode (
   IN taxnodeID INT
)
BEGIN
   DECLARE treeID INT;

   -- Get the taxon's tree ID.
   SET treeID = (SELECT tree_id FROM taxonomy_node WHERE taxnode_id = taxnodeID LIMIT 1);

   -- Get all nodes in the target node's lineage.
   WITH lineage_nodes AS (

      SELECT 
         ancestor_node.taxnode_id,

         -- All lineage nodes above the target node will be expanded when displayed.
         CASE 
            WHEN ancestor_node.taxnode_id = taxnodeID THEN 0 
            ELSE 1 
         END AS is_expanded

      FROM taxonomy_node ancestor_node
      JOIN taxonomy_level ancestor_level ON ancestor_level.id = ancestor_node.level_id
      JOIN taxonomy_node target_node ON (

         -- The target node's left index is between the ancestor's left and right indices.
         target_node.left_idx BETWEEN ancestor_node.left_idx AND ancestor_node.right_idx

         -- The target and ancestors should have the same tree ID (be in the same MSL release).
         AND target_node.tree_id = ancestor_node.tree_id

         -- Don't include the tree node
         AND ancestor_node.taxnode_id <> target_node.tree_id
      )
      WHERE target_node.taxnode_id = taxnodeID
      AND target_node.is_hidden = 0
      AND target_node.is_deleted = 0
   ),
   -- Immediate child nodes of the lineage nodes.
   lineage_children AS (

      SELECT taxnode_id, 0 AS is_expanded
      FROM taxonomy_node tn
      WHERE tn.parent_id IN (SELECT taxnode_id FROM lineage_nodes) -- Lineage nodes are the parents
      AND tn.parent_id <> taxnodeID -- Exclude the child of the target node.
      AND tn.taxnode_id NOT IN (SELECT taxnode_id FROM lineage_nodes) -- Exclude duplicate lineage nodes
      AND tn.is_hidden = 0
      AND tn.is_deleted = 0
   ),
   -- Get all nodes that are an immediate child of the tree.
   top_level_nodes AS (

      SELECT 
         topTN.taxnode_id,

         -- No top-level nodes will be expanded when displayed (other than the 
         -- target node's top level node). 
         0 AS is_expanded
         
      FROM taxonomy_node topTN
      JOIN taxonomy_level topLevel ON topLevel.id = topTN.level_id
      WHERE topTN.parent_id = treeID
      AND topTN.taxnode_id <> treeID
      AND topTN.tree_id = treeID
      AND topTN.is_hidden = 0
      AND topTN.is_deleted = 0
      AND topTN.taxnode_id NOT IN (SELECT taxnode_id FROM lineage_nodes)
   )

   -- Get all taxonomy nodes that are in the target node's lineage or whose 
   -- parent node is the tree node (root).
   SELECT
      parent.level_id AS parent_level_id,
      parent_level.name AS parent_level_name,
      1 AS visible_parent,
      taxa_nodes.is_expanded,
      tn.taxa_desc_cts AS childTaxaCount,
      tn.filename,
      tn.taxa_kid_cts AS immediateChildTaxaCount,
      tn.is_ref AS is_reference,
      tl.name AS level_name,
      tl.id AS level_id,
      tn.lineage,
      tn.msl_release_num,
      (SELECT COUNT(*) 
       FROM taxonomy_node_delta
       WHERE prev_taxid = tn.taxnode_id
       AND (tag_csv IS NOT NULL AND tag_csv <> '')
      ) AS next_delta_count,
      tn.node_depth,
      tn._numKids AS num_children,
      tn.parent_id,
      (SELECT COUNT(*) 
       FROM taxonomy_node_delta
       WHERE new_taxid = tn.taxnode_id
       AND (tag_csv IS NOT NULL AND tag_csv <> '')
      ) AS prev_delta_count,
      tn.cleaned_name AS taxon_name,
      tn.taxnode_id,
      tn.tree_id,
      tn.left_idx,
      tn.right_idx,
      tn.is_hidden,
      tn.is_deleted

   FROM taxonomy_node tn
   JOIN taxonomy_level tl ON tl.id = tn.level_id
   JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
   JOIN taxonomy_level parent_level ON parent_level.id = parent.level_id

   -- Combine the lineage and top-level nodes.
   JOIN (
      -- Lineage nodes
      SELECT taxnode_id, is_expanded 
      FROM lineage_nodes

      UNION ALL

      -- Top-level nodes
      SELECT taxnode_id, is_expanded
      FROM top_level_nodes

      UNION ALL

      -- Immediate child nodes of the lineage nodes.
      SELECT taxnode_id, is_expanded
      FROM lineage_children

   ) taxa_nodes ON tn.taxnode_id = taxa_nodes.taxnode_id
   ORDER BY
      tn.left_idx,
      CASE WHEN tn.start_num_sort IS NULL THEN COALESCE(tn.name, 'ZZZZ')
         ELSE LEFT(tn.name, tn.start_num_sort)
      END,
      CASE WHEN tn.start_num_sort IS NULL THEN NULL
         ELSE FLOOR(LTRIM(SUBSTRING(tn.name, tn.start_num_sort + 1, 50)))
      END;

END //

DELIMITER ;