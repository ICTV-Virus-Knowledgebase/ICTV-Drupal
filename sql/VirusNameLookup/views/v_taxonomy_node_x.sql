
CREATE OR REPLACE VIEW `v_taxonomy_node_x` AS 

SELECT 
   node.*, 
   target.taxnode_id AS target_taxnode_id,
   target.name AS target_name,
   target.lineage AS target_lineage 
   
FROM v_taxonomy_node target
JOIN v_taxonomy_node_merge_split ms ON target.ictv_id = ms.prev_ictv_id
JOIN v_taxonomy_node node ON node.ictv_id = ms.next_ictv_id
