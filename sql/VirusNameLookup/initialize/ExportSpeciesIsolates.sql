
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/05/24
-- Description: Export the contents of species_isolates to a CSV file.
-- Updated:
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportSpeciesIsolatesAsCSV') IS NOT NULL
	DROP PROCEDURE dbo.exportSpeciesIsolatesAsCSV
GO

CREATE PROCEDURE dbo.exportSpeciesIsolatesAsCSV
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

   SELECT 
      'isolate_id, '+
      'taxnode_id, '+
      'species_name, '+
      'isolate_name, '+
      'isolate_names, '+
      'isolate_abbrevs, '+
      'isolate_designation, '+
      'genbank_accessions, '+
      'refseq_accessions, '+
      'host_source, '+
      'refseq_organism, '+
      'msl_release_num'

   UNION ALL (
      SELECT 
         CAST(si.isolate_id as varchar(12))+','+
         CAST(si.taxnode_id as varchar(12))+','+
         CASE WHEN si.species_name IS NULL THEN '' ELSE '"'+si.species_name+'"' END+','+
         CASE WHEN si._isolate_name IS NULL THEN '' ELSE '"'+si._isolate_name+'"' END+','+
         CASE WHEN si.isolate_names IS NULL THEN '' ELSE '"'+si.isolate_names+'"' END+','+
         CASE WHEN si.isolate_abbrevs IS NULL THEN '' ELSE '"'+si.isolate_abbrevs+'"' END+','+
         CASE WHEN si.isolate_designation IS NULL THEN '' ELSE '"'+si.isolate_designation+'"' END+','+
         CASE WHEN si.genbank_accessions IS NULL THEN '' ELSE '"'+si.genbank_accessions+'"' END+','+
         CASE WHEN si.refseq_accessions IS NULL THEN '' ELSE '"'+si.refseq_accessions+'"' END+','+
         CASE WHEN si.host_source IS NULL THEN '' ELSE '"'+si.host_source+'"' END+','+
         CASE WHEN si.refseq_organism IS NULL THEN '' ELSE '"'+si.refseq_organism+'"' END+','+
         CAST(tn.msl_release_num AS VARCHAR(12))
      
      FROM species_isolates si
      JOIN taxonomy_node tn ON tn.taxnode_id = si.taxnode_id
   )

END
