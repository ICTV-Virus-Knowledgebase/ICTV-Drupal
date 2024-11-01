
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/05/24
-- Description: Export the latest versions of taxonomy nodes to a TSV file. NOTE: this is a SQL Server script!
-- Updated: 10/23/24 dmd: Copied from exportTaxonomyNodesAsTSV
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportLatestTaxonomyNodesAsTSV') IS NOT NULL
	DROP PROCEDURE dbo.exportLatestTaxonomyNodesAsTSV
GO

CREATE PROCEDURE dbo.exportLatestTaxonomyNodesAsTSV
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

   SELECT 
      'abbrev_csv'+Char(9)+
      'cleaned_name'+Char(9)+
	   'current_taxnode_id'+Char(9)+
      'exemplar_name'+Char(9)+
      'genbank_accession_csv'+Char(9)+
      'isolate_csv'+Char(9)+
      'matching_name'+Char(9)+
      'matching_taxnode_id'+Char(9)+
      'msl_release_num'+Char(9)+
      'name'+Char(9)+
      'parent_id'+Char(9)+
      'rank_name'+Char(9)+
      'refseq_accession_csv'

   UNION ALL (

      SELECT 
			CASE WHEN tn.abbrev_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.abbrev_csv, '"', '')+'"' END+Char(9)+
			CASE WHEN tn.cleaned_name IS NULL THEN '' ELSE '"'+REPLACE(tn.cleaned_name, '"', '')+'"' END+Char(9)+
         CAST(tn.taxnode_id AS VARCHAR(12))+Char(9)+
			CASE WHEN tn.exemplar_name IS NULL THEN '' ELSE '"'+REPLACE(tn.exemplar_name, '"', '')+'"' END+Char(9)+
			CASE WHEN tn.genbank_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.genbank_accession_csv, '"', '')+'"' END+Char(9)+
			CASE WHEN tn.isolate_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.isolate_csv, '"', '')+'"' END+Char(9)+
         CASE WHEN latest.distinct_name IS NULL THEN '' ELSE '"'+REPLACE(latest.distinct_name, '"', '')+'"' END+Char(9)+
         CAST(latest.taxnode_id AS VARCHAR(12))+Char(9)+
			CAST(tn.msl_release_num AS VARCHAR(12))+Char(9)+
			CASE WHEN tn.[name] IS NULL THEN '' ELSE '"'+REPLACE(tn.[name], '"', '')+'"' END+Char(9)+
			CAST(tn.parent_id AS VARCHAR(12))+Char(9)+
			CASE WHEN tl.[name] IS NULL THEN '' ELSE '"'+tl.[name]+'"' END+Char(9)+
			CASE WHEN tn.refseq_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.refseq_accession_csv, '"', '')+'"' END
         
		FROM (
			SELECT distinct_name,
				taxnode_id = (
					SELECT TOP 1 latest_tn.taxnode_id
					FROM taxonomy_node latest_tn
					WHERE latest_tn.name = distinct_name
					ORDER BY latest_tn.msl_release_num DESC
				)
			FROM (
				SELECT DISTINCT distinct_tn.name AS distinct_name
				FROM taxonomy_node distinct_tn
			) distinctNames
		) latest
		JOIN taxonomy_node_x tnx ON tnx.target_taxnode_id = latest.taxnode_id
		JOIN taxonomy_node tn ON tn.taxnode_id = tnx.taxnode_id
		JOIN taxonomy_level tl ON tl.id = tn.level_id
		WHERE tnx.msl_release_num IS NOT NULL
		AND tnx.msl_release_num = (
			SELECT TOP 1 tn2.msl_release_num
			FROM taxonomy_node_x tn2
			WHERE tn2.target_taxnode_id = latest.taxnode_id
			ORDER BY tn2.msl_release_num DESC
		)
		AND tnx.taxnode_id <> tnx.tree_id
   )

END
