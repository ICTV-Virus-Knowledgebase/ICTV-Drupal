
/*
   Populate the temp NCBI Taxonomy tables with data from ictv_apps.

   Note that the database prefixes are hard-coded below to avoid clobbering
   the NCBI Taxonomy tables in ictv_apps.
*/

USE ictv_apps_temp;


/*
   The NCBI Division table
*/

-- Delete existing records from NCBI division in ictv_apps_temp.
DELETE FROM ictv_apps_temp.ncbi_division;

-- Copy records from NCBI division in ictv_apps to ictv_apps_temp.
INSERT INTO ictv_apps_temp.ncbi_division (
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

FROM ictv_apps.ncbi_division;


/*
   The NCBI name table
*/

-- Delete existing records from NCBI name in ictv_apps_temp.
DELETE FROM ictv_apps_temp.ncbi_name;

-- Copy records from NCBI name in ictv_apps to ictv_apps_temp.
INSERT INTO ictv_apps_temp.ncbi_name (
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

FROM ictv_apps.ncbi_name;


/*
   The NCBI node table
*/

-- Temporarily drop the self-referential foreign key constraint.
ALTER TABLE ictv_apps_temp.ncbi_node
DROP FOREIGN KEY IF EXISTS FK_parent_tax_id_tax_id;

-- Delete existing records from NCBI node in ictv_apps_temp.
DELETE FROM ictv_apps_temp.ncbi_node;

-- Copy records from NCBI node in ictv_apps to ictv_apps_temp.
INSERT INTO ictv_apps_temp.ncbi_node (
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

FROM ictv_apps.ncbi_node;

-- Add the self-referential foreign key constraint.
ALTER TABLE ictv_apps_temp.ncbi_node
ADD CONSTRAINT `FK_parent_tax_id_tax_id` 
FOREIGN KEY (`parent_tax_id`) 
REFERENCES ictv_apps_temp.ncbi_node (`tax_id`)
ON DELETE NO ACTION ON UPDATE NO ACTION;









