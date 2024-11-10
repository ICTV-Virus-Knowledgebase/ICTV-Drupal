
-- This query exports the subspecies lookup table (SQL Server) as multiple queries to update 
-- relevant NCBI Taxonomy entries in taxon_name (subspecies taxa and their mapping to the latest
-- ICTV info).

-- TODO: replace the text "@ncbiTaxDbTID" with the term ID for the NCBI Taxonomy DB.
SELECT
'UPDATE taxon_name SET '+
'ictv_msl_release = '+CASE WHEN ictv_msl_release IS NULL THEN 'NULL' ELSE CAST(ictv_msl_release AS VARCHAR(12)) END+', '+
'ictv_name = '+CASE WHEN ictv_name IS NULL THEN 'NULL' ELSE ''''+ictv_name+'''' END+', '+
'ictv_rank_name = '+CASE WHEN ictv_rank_name IS NULL THEN 'NULL' ELSE ''''+ictv_rank_name+'''' END+', '+
'ictv_taxnode_id = '+CASE WHEN ictv_taxnode_id IS NULL THEN 'NULL' ELSE CAST(ictv_taxnode_id AS VARCHAR(12)) END+', '+
'parent_name = '+CASE WHEN parent_name IS NULL THEN 'NULL' ELSE ''''+parent_name+'''' END+', '+
'parent_rank = '+CASE WHEN parent_rank IS NULL THEN 'NULL' ELSE ''''+parent_rank+'''' END+', '+
'parent_taxonomy_db_tid = @ncbiTaxDbTID, '+
'parent_taxonomy_id = '+CASE WHEN parent_tax_id IS NULL THEN 'NULL' ELSE CAST(parent_tax_id AS VARCHAR(12)) END+' '+
'WHERE taxonomy_db_tid = @ncbiTaxDbTID '+
'AND taxonomy_id = '+CAST(tax_id AS VARCHAR(12))+'; '
FROM subspecies_lookup

