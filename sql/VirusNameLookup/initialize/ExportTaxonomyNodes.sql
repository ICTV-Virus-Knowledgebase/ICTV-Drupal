
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/05/24
-- Description: Export the contents of taxonomy_node to a CSV file.
-- Updated:
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportTaxonomyNodesAsCSV') IS NOT NULL
	DROP PROCEDURE dbo.exportTaxonomyNodesAsCSV
GO

CREATE PROCEDURE dbo.exportTaxonomyNodesAsCSV
   @mslRelease INT
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

   SELECT 
      'taxnode_id, '+
      'abbrev_csv, '+
      'cleaned_name, '+
      'exemplar_name, '+
      'genbank_accession_csv, '+
      'isolate_csv, '+
      'msl_release_num, '+
      'name, '+
      'rank_name, '+
      'refseq_accession_csv'

   UNION ALL (

      SELECT 
         CAST(tn.taxnode_id AS VARCHAR(12))+','+
         CASE WHEN tn.abbrev_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.abbrev_csv, '"', '')+'"' END+','+
         CASE WHEN tn.cleaned_name IS NULL THEN '' ELSE '"'+REPLACE(tn.cleaned_name, '"', '')+'"' END+','+
         CASE WHEN tn.exemplar_name IS NULL THEN '' ELSE '"'+REPLACE(tn.exemplar_name, '"', '')+'"' END+','+
         CASE WHEN tn.genbank_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.genbank_accession_csv, '"', '')+'"' END+','+
         CASE WHEN tn.isolate_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.isolate_csv, '"', '')+'"' END+','+
	      CAST(tn.msl_release_num AS VARCHAR(12))+','+
         CASE WHEN tn.[name] IS NULL THEN '' ELSE '"'+REPLACE(tn.[name], '"', '')+'"' END+','+
         CASE WHEN tl.[name] IS NULL THEN '' ELSE '"'+tl.[name]+'"' END+','+
         CASE WHEN tn.refseq_accession_csv IS NULL THEN '' ELSE '"'+REPLACE(tn.refseq_accession_csv, '"', '')+'"' END

      FROM taxonomy_node tn
      JOIN taxonomy_level tl ON tl.id = tn.level_id
      WHERE msl_release_num IS NOT NULL
      AND tn.taxnode_id <> tn.tree_id
      AND (@mslRelease IS NULL OR msl_release_num = @mslRelease)
   )

END
