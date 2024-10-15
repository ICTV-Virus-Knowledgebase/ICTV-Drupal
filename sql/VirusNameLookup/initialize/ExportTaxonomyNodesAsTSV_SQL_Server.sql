
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/05/24
-- Description: Export the contents of taxonomy_node to a TSV file. NOTE: this is a SQL Server script!
-- Updated: 10/10/24 dmd: Including current_taxnode_id.
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportTaxonomyNodesAsTSV') IS NOT NULL
	DROP PROCEDURE dbo.exportTaxonomyNodesAsTSV
GO

CREATE PROCEDURE dbo.exportTaxonomyNodesAsTSV
   @mslRelease INT
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

   SELECT 
      'taxnode_id'+Char(9)+
      'abbrev_csv'+Char(9)+
      'cleaned_name'+Char(9)+
	   'current_taxnode_id'+Char(9)+
      'exemplar_name'+Char(9)+
      'genbank_accession_csv'+Char(9)+
      'isolate_csv'+Char(9)+
      'msl_release_num'+Char(9)+
      'name'+Char(9)+
      'parent_id'+Char(9)+
      'rank_name'+Char(9)+
      'refseq_accession_csv'

   UNION ALL (

      SELECT 
         CAST(tn.taxnode_id AS VARCHAR(12))+Char(9)+
         CASE WHEN tn.abbrev_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.abbrev_csv, '"', '')+'"' END+Char(9)+
         CASE WHEN tn.cleaned_name IS NULL THEN '' ELSE '"'+REPLACE(tn.cleaned_name, '"', '')+'"' END+Char(9)+
         CAST((
            SELECT TOP 1 ctn.taxnode_id
            FROM taxonomy_node ctn
            WHERE ctn.ictv_id = tn.ictv_id
            ORDER BY ctn.msl_release_num DESC
         ) AS VARCHAR(12))+Char(9)+
         CASE WHEN tn.exemplar_name IS NULL THEN '' ELSE '"'+REPLACE(tn.exemplar_name, '"', '')+'"' END+Char(9)+
         CASE WHEN tn.genbank_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.genbank_accession_csv, '"', '')+'"' END+Char(9)+
         CASE WHEN tn.isolate_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.isolate_csv, '"', '')+'"' END+Char(9)+
	      CAST(tn.msl_release_num AS VARCHAR(12))+Char(9)+
         CASE WHEN tn.[name] IS NULL THEN '' ELSE '"'+REPLACE(tn.[name], '"', '')+'"' END+Char(9)+
         CAST(tn.parent_id AS VARCHAR(12))+Char(9)+
         CASE WHEN tl.[name] IS NULL THEN '' ELSE '"'+tl.[name]+'"' END+Char(9)+
         CASE WHEN tn.refseq_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.refseq_accession_csv, '"', '')+'"' END

      FROM taxonomy_node tn
      JOIN taxonomy_level tl ON tl.id = tn.level_id
      WHERE msl_release_num IS NOT NULL
      AND tn.taxnode_id <> tn.tree_id
      AND (@mslRelease IS NULL OR msl_release_num = @mslRelease)
   )

END
