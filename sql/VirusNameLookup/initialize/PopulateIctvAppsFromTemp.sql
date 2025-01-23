
/*
   This script populates the "latest release of ICTV ID" and "searchable taxon" tables in the ictv_apps database 
   with data from the corresponding tables in the ictv_apps_temp database.
*/

/*
   The "latest release of ICTV ID" table
*/

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


/*
   The "searchable taxon" table
*/

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







