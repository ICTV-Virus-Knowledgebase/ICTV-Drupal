
/* 
   Populate tables in the ictv_apps database with data from the corresponding tables in the ictv_apps_temp database.
*/

-- ======================================================================================================================
-- Latest release of ICTV ID
-- ======================================================================================================================

-- Delete existing records from latest_release_of_ictv_id in ictv_apps.
DELETE FROM ictv_apps.latest_release_of_ictv_id;

-- Copy records from latest_release_of_ictv_id in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.latest_release_of_ictv_id (
   `ictv_id`,
   `latest_msl_release`
)
SELECT 
   `ictv_id`,
   `latest_msl_release`
FROM ictv_apps_temp.latest_release_of_ictv_id;


-- ======================================================================================================================
-- Searchable Taxon
-- ======================================================================================================================

-- Disable foreign key checks.
SET FOREIGN_KEY_CHECKS=0;

-- Delete existing records from searchable_taxon in ictv_apps.
DELETE FROM ictv_apps.searchable_taxon;

-- Copy records from searchable_taxon in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.searchable_taxon (
   `id`,
   `division_tid`,
   `filtered_name`,
   `ictv_id`,
   `ictv_taxnode_id`,
   `intermediate_name`,
   `intermediate_rank`,
   `is_valid`,
   `name`,
   `name_class_tid`,
   `parent_taxonomy_db_tid`,
   `parent_taxonomy_id`,
   `rank_name_tid`,
   `taxonomy_db_tid`,
   `taxonomy_id`,
   `version_id`,
   `created_on`
)
SELECT 
   `id`,
   `division_tid`,
   `filtered_name`,
   `ictv_id`,
   `ictv_taxnode_id`,
   `intermediate_name`,
   `intermediate_rank`,
   `is_valid`,
   `name`,
   `name_class_tid`,
   `parent_taxonomy_db_tid`,
   `parent_taxonomy_id`,
   `rank_name_tid`,
   `taxonomy_db_tid`,
   `taxonomy_id`,
   `version_id`,
   `created_on`

FROM ictv_apps_temp.searchable_taxon;

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS=1;


-- ======================================================================================================================
-- Disease Ontology
-- ======================================================================================================================

-- Delete existing records from disease_ontology in ictv_apps.
DELETE FROM ictv_apps.disease_ontology;

-- Copy records from disease_ontology in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.disease_ontology (
   `id`,
   `definition`,
   `disease_name`,
   `doid`,
   `ictv_id`,
   `ictv_taxnode_id`,
   `imported_on`,
   `ncbi_name`,
   `ncbi_taxid`,
   `possible_name`
)
SELECT 
   `id`,
   `definition`,
   `disease_name`,
   `doid`,
   `ictv_id`,
   `ictv_taxnode_id`,
   `imported_on`,
   `ncbi_name`,
   `ncbi_taxid`,
   `possible_name`

FROM ictv_apps_temp.disease_ontology;


-- ======================================================================================================================
-- NCBI division
-- ======================================================================================================================

-- Disable foreign key checks.
SET FOREIGN_KEY_CHECKS=0;

-- Delete existing records from ncbi_division in ictv_apps.
DELETE FROM ictv_apps.ncbi_division;

-- Copy records from ncbi_division in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.ncbi_division (
   `id`,
   `cde`,
   `name`,
   `comments`,
   `tid`
)
SELECT 
   `id`,
   `cde`,
   `name`,
   `comments`,
   `tid`

FROM ictv_apps_temp.ncbi_division;

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS=1;


-- ======================================================================================================================
-- NCBI name
-- ======================================================================================================================

-- Disable foreign key checks.
SET FOREIGN_KEY_CHECKS=0;

-- Delete existing records from ncbi_name in ictv_apps.
DELETE FROM ictv_apps.ncbi_name;

-- Copy records from ncbi_name in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.ncbi_name (
   `tax_id`,
   `name_txt`,
   `unique_name`,
   `name_class`,
   `name_class_tid`
)
SELECT 
   `tax_id`,
   `name_txt`,
   `unique_name`,
   `name_class`,
   `name_class_tid`

FROM ictv_apps_temp.ncbi_name;

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS=1;


-- ======================================================================================================================
-- NCBI node
-- ======================================================================================================================

-- Disable foreign key checks.
SET FOREIGN_KEY_CHECKS=0;

-- Delete existing records from ncbi_node in ictv_apps.
DELETE FROM ictv_apps.ncbi_node;

-- Copy records from ncbi_node in ictv_apps_temp to ictv_apps.
INSERT INTO ictv_apps.ncbi_node (
   `tax_id`,
   `parent_tax_id`,
   `rank_name`,
   `rank_name_tid`,
   `embl_code`,
   `division_id`,
   `ictv_taxnode_id`,
   `inherited_div_flag`,
   `genetic_code_id`,
   `inherited_gc_flag`,
   `mitochondrial_genetic_code_id`,
   `inherited_mgc_flag`,
   `genbank_hidden_flag`,
   `hidden_subtree_root_flag`,
   `comments`,
   `subspecies_parent_tax_id`
)
SELECT 
   `tax_id`,
   `parent_tax_id`,
   `rank_name`,
   `rank_name_tid`,
   `embl_code`,
   `division_id`,
   `ictv_taxnode_id`,
   `inherited_div_flag`,
   `genetic_code_id`,
   `inherited_gc_flag`,
   `mitochondrial_genetic_code_id`,
   `inherited_mgc_flag`,
   `genbank_hidden_flag`,
   `hidden_subtree_root_flag`,
   `comments`,
   `subspecies_parent_tax_id`

FROM ictv_apps_temp.ncbi_node;

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS=1;





