
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 10/23/24
-- Description: Export the latest versions of species taxonomy nodes to a TSV file. NOTE: this is a SQL Server script!
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportTaxonomyNodeSpeciesLookupAsTSV') IS NOT NULL
	DROP PROCEDURE dbo.exportTaxonomyNodeSpeciesLookupAsTSV
GO

CREATE PROCEDURE dbo.exportTaxonomyNodeSpeciesLookupAsTSV
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON


   SELECT 
         parentTL.name AS parent_rank,
         parent.name as parent_name,
         tn.name,
         epithet = REPLACE(tn.name, parent.name+' ', '')
         
      FROM (
         SELECT distinct_name,
            latest_taxnode_id = (
               SELECT TOP 1 latest_tn.taxnode_id
               FROM taxonomy_node latest_tn
               WHERE latest_tn.name = distinct_name
               ORDER BY latest_tn.msl_release_num DESC
            )
         FROM (
            SELECT DISTINCT distinct_tn.name AS distinct_name
            FROM taxonomy_node distinct_tn
            JOIN taxonomy_level distinct_tl ON distinct_tl.id = distinct_tn.level_id
            WHERE distinct_tl.name = 'species'
            AND distinct_tn.msl_release_num > 38
            AND distinct_tn.msl_release_num IS NOT NULL
         ) distinctNames
      ) latestNameAndID
      JOIN taxonomy_node tn ON tn.taxnode_id = latestNameAndID.latest_taxnode_id
      JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
      JOIN taxonomy_level parentTL ON parentTL.id = parent.level_id
      WHERE tn.msl_release_num > 38
      AND parentTL.name = 'genus'

END