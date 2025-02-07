
CREATE OR REPLACE VIEW `v_curated_name` AS 

SELECT 
   cn.comments,
   cn.created_by,
   cn.created_on,
   division.term_key AS division,
   cn.division_tid,
   tn.ictv_id,
   cn.ictv_taxnode_id,
	cn.id,
   cn.is_valid,
   cn.name,
   nameClass.term_key AS name_class,
   cn.name_class_tid,
   tn.rank_name,
   -- cn.rank_name_tid,
   taxonomyDB.term_key AS taxonomy_db,
   cn.taxonomy_db_tid,
   cn.taxonomy_id,
   tn.name AS taxon_name,
   typeTerm.term_key AS type,
   cn.type_tid,
   HEX(cn.uid) AS uid,
   cn.version_id
   
FROM curated_name cn
LEFT JOIN term division ON division.id = cn.division_tid
LEFT JOIN term nameClass ON nameClass.id = cn.name_class_tid
-- LEFT JOIN term rankName ON rankName.id = cn.rank_name_tid
LEFT JOIN term taxonomyDB ON taxonomyDB.id = cn.taxonomy_db_tid
LEFT JOIN term typeTerm ON typeTerm.id = cn.type_tid
LEFT JOIN v_taxonomy_node_names tn ON tn.taxnode_id  = cn.ictv_taxnode_id;