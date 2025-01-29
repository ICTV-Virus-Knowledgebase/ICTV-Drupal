
-- TODO: Make sure the name of the current ICTVonline* database is correct!

CREATE OR REPLACE VIEW `v_taxonomy_node_names` AS 

SELECT 
   family,
   family_id,
   genus,
   genus_id,
   host_source,
   is_deleted,
   is_hidden,
   level_id,
   `name`,
   ictv_id,
   lineage,
   msl_release_num,
   parent_id,
   rank AS rank_name,
   subfamily,
   subfamily_id,
   subgenus,
   subgenus_id,
   taxnode_id,
   tree_id

FROM ictv_taxonomy.taxonomy_node_names;