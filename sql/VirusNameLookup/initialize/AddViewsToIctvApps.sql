
/*
   Add views to the ictv_apps database.
*/

-- Create a view for the searchable_taxon table.
CREATE OR REPLACE VIEW `v_searchable_taxon` AS 
SELECT 
	st.id,
	divTerm.term_key AS division,
	st.division_tid,
	st.filtered_name,
   st.ictv_id,
   st.ictv_taxnode_id,
   st.intermediate_name,
   st.intermediate_rank,
	st.is_valid,
	st.name,
	nameClass.term_key AS name_class,
	st.name_class_tid,
	parentTaxDB.term_key AS parent_taxonomy_db,
   st.parent_taxonomy_db_tid,
	st.parent_taxonomy_id,
	rankName.term_key AS rank_name,
	st.rank_name_tid,
	taxDB.term_key AS taxonomy_db,
	st.taxonomy_db_tid,
	st.taxonomy_id,
	st.version_id,
	st.created_on

FROM searchable_taxon st
JOIN term divTerm ON divTerm.id = st.division_tid
JOIN term nameClass ON nameClass.id = st.name_class_tid
LEFT JOIN term parentTaxDB ON parentTaxDB.id = st.parent_taxonomy_db_tid
JOIN term rankName ON rankName.id = st.rank_name_tid
JOIN term taxDB ON taxDB.id = st.taxonomy_db_tid;


-- Create a view for the species_isolates table in the ictv_taxonomy database.
CREATE OR REPLACE VIEW `v_species_isolates` AS 
SELECT *
FROM ictv_taxonomy.species_isolates;


-- Create a view for the taxonomy_node_merge_split table in the ictv_taxonomy database.
CREATE OR REPLACE VIEW `v_taxonomy_node_merge_split` AS 
SELECT *
FROM ictv_taxonomy.taxonomy_node_merge_split;


-- Create a view for the taxonomy_node_names view in the ictv_taxonomy database.
-- Note that we aren't using the `*` wildcard because this view includes multiple joins that are unnecessary.
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

FROM ictv_taxonomy.taxonomy_node_names;


-- Create a view for the taxonomy_node table in the ictv_taxonomy database.
-- CREATE OR REPLACE VIEW `v_taxonomy_node` AS 
-- SELECT *
-- FROM ictv_taxonomy.taxonomy_node;


