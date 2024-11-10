
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/05/24
-- Description: Export the contents of species_isolates to a TSV file. NOTE: this is a SQL Server script!
-- Updated:
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportSpeciesIsolatesAsTSV') IS NOT NULL
	DROP PROCEDURE dbo.exportSpeciesIsolatesAsTSV
GO

CREATE PROCEDURE dbo.exportSpeciesIsolatesAsTSV
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

   SELECT 
      'isolate_id'+Char(9)+
      'taxnode_id'+Char(9)+
      'species_name'+Char(9)+
      'isolate_names'+Char(9)+
      'isolate_abbrevs'+Char(9)+
      'isolate_designation'+Char(9)+
      'genbank_accessions'+Char(9)+
      'refseq_accessions'+Char(9)+
      'host_source'+Char(9)+
      'refseq_organism'+Char(9)+
      'msl_release_num'

   UNION ALL (
      SELECT 
         CAST(si.isolate_id as varchar(12))+Char(9)+
         CAST(si.taxnode_id as varchar(12))+Char(9)+
         CASE WHEN si.species_name IS NULL THEN '' ELSE '"'+REPLACE(si.species_name, '"', '')+'"' END+Char(9)+
         CASE WHEN si.isolate_names IS NULL THEN '' ELSE '"'+REPLACE(si.isolate_names, '"', '')+'"' END+Char(9)+
         CASE WHEN si.isolate_abbrevs IS NULL THEN '' ELSE '"'+REPLACE(si.isolate_abbrevs, '"', '')+'"' END+Char(9)+
         CASE WHEN si.isolate_designation IS NULL THEN '' ELSE '"'+REPLACE(si.isolate_designation, '"', '')+'"' END+Char(9)+
         CASE WHEN si.genbank_accessions IS NULL THEN '' ELSE '"'+REPLACE(si.genbank_accessions, '"', '')+'"' END+Char(9)+
         CASE WHEN si.refseq_accessions IS NULL THEN '' ELSE '"'+REPLACE(si.refseq_accessions, '"', '')+'"' END+Char(9)+
         CASE WHEN si.host_source IS NULL THEN '' ELSE '"'+si.host_source+'"' END+Char(9)+
         CASE WHEN si.refseq_organism IS NULL THEN '' ELSE '"'+REPLACE(si.refseq_organism, '"', '')+'"' END+Char(9)+
         CAST(tn.msl_release_num AS VARCHAR(12))
      
      FROM species_isolates si
      JOIN taxonomy_node tn ON tn.taxnode_id = si.taxnode_id
   )

END
