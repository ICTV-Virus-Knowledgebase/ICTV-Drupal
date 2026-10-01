

-- NOTE: msl_release_num is hard-coded to 41 below!!!
-- TODO: This should be able to handle abolished taxa (with an earlier MSL)

UPDATE report_chapter_node 
JOIN ictv_taxonomy.taxonomy_node tn ON tn.name = report_chapter_node.taxon_name
SET report_chapter_node.taxnode_id = tn.taxnode_id
WHERE tn.taxnode_id IS NULL OR tn.msl_release_num = 41
