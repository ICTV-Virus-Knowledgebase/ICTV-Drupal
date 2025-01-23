
/*
   Add views to the ictv_apps_temp database.

   TODO: Make sure the name of the ICTV taxonomy temp database below is correct!
*/

USE ictv_apps_temp;


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


-- TODO: Make sure the name of the current ICTVonline* database is correct!
CREATE OR REPLACE VIEW `v_species_isolates` AS 
SELECT *
FROM ICTVonline39.species_isolates;
-- ictv_taxonomy_temp.species_isolates;


-- TODO: Make sure the name of the current ICTVonline* database is correct!
CREATE OR REPLACE VIEW `v_taxonomy_node_merge_split` AS 
SELECT *
FROM ICTVonline39.taxonomy_node_merge_split;
-- ictv_taxonomy_temp.taxonomy_node_merge_split;


-- TODO: Make sure the name of the current ICTVonline* database is correct!
CREATE OR REPLACE VIEW `v_taxonomy_node_names` AS 
SELECT 
   family_id,
   genus_id,
   host_source,
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
-- ictv_taxonomy_temp.taxonomy_node_names;

