
-- TODO: Make sure the name of the current ICTVonline* database is correct!

CREATE OR REPLACE VIEW `v_taxonomy_node_names` AS 

SELECT 
   family_id,
   genus_id,
   level_id,
   `name`,
   ictv_id,
   lineage,
   msl_release_num,
   parent_id,
   rank AS rank_name,
   subfamily_id,
   subgenus_id,
   taxnode_id,
   tree_id

FROM ICTVonline39.taxonomy_node_names;