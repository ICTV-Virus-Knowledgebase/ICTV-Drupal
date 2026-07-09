
DROP PROCEDURE IF EXISTS `ImportNcbiTaxonomy`;

DELIMITER //

-- Import NCBI Taxonomy records into the searchable_taxon table. Note that this excludes subspecies ranks, which are 
-- imported separately in the ImportNcbiSubspeciesNodes.sql script.
CREATE PROCEDURE ImportNcbiTaxonomy()
BEGIN

   DECLARE ncbiTaxDbTID INT;

   -- ===========================================================================================================
   -- Lookup the term ID for the NCBI taxonomy database.
   -- ===========================================================================================================
   SET ncbiTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for taxonomy_db.ncbi_taxonomy';
   END IF;

   -- Delete any existing NCBI Taxonomy records from the searchable_taxon table.
   DELETE FROM searchable_taxon WHERE taxonomy_db_tid = ncbiTaxDbTID;
   
   
   -- ===========================================================================================================
   -- Create the new searchable_taxon records.
   -- ===========================================================================================================
	INSERT INTO searchable_taxon (
		division_tid,
		filtered_name,
      ictv_id,
      ictv_taxnode_id,
		`name`,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	) 
   -- Return NCBI taxa that are species or higher along with a possible match in ICTV taxonomy.
   SELECT
      d.tid,
      REPLACE(
         REPLACE(
            REPLACE(
               REPLACE(
                  REPLACE(
                     REPLACE(
                        REPLACE(
                           REPLACE(
                              REPLACE(
                                 REPLACE(
                                    REPLACE(
                                       REPLACE(
                                          REPLACE(
                                             REPLACE(
                                                REPLACE(nname.name_txt, '-', ' ')
                                             , '_', ' ')
                                          , '`', '')
                                       , '"', '')
                                    , '''', '')
                                 , '!', '')
                              , '?', '')
                           , '  ', ' ')
                        , '(', ',')
                     , ')', ',')
                  , ';', ',')
               , ':', ',')
            , ',,', ',')
         , '/', ' ')
      , '\\', ' ') AS filtered_name,
      latestTN.ictv_id,
      latestTN.latestTaxnodeID AS ictv_taxnode_id,
      nname.name_txt,
      nname.name_class_tid,
      ncbiTaxDbTID AS parent_taxonomy_db_tid,
      nnode.parent_tax_id AS parent_taxonomy_id,
      nnode.rank_name_tid,
      ncbiTaxDbTID AS taxonomy_db_tid,
      nnode.tax_id AS taxonomy_id,

      -- TODO: Does NCBI Taxonomy have a version number? If so, we should use it here instead of hardcoding 1.
      1 AS version_id

   FROM ncbi_node nnode
   JOIN ncbi_name nname ON nname.tax_id = nnode.tax_id
   JOIN ncbi_division d ON d.id = nnode.division_id
   LEFT JOIN (
      SELECT 
         DISTINCT tn.name,
         tn.ictv_id,
         (
            SELECT tnid.taxnode_id
            FROM v_taxonomy_node_names tnid
            WHERE tnid.name = tn.name
            AND tnid.tree_id <> tnid.taxnode_id
            AND tnid.msl_release_num IS NOT NULL
            ORDER BY tnid.msl_release_num DESC
            LIMIT 1
         ) AS latestTaxnodeID
      FROM v_taxonomy_node_names tn
      WHERE tn.taxnode_id <> tn.tree_id
      AND tn.msl_release_num IS NOT NULL
      
   ) latestTN ON latestTN.name = nname.name_txt

   -- Exclude subspecies ranks
   WHERE nnode.rank_name_tid NOT IN (
      SELECT t.id
      FROM v_subspecies_name_classes snc
      JOIN term t ON t.label = snc.name_class
   );
   
   -- (genotypeTID, isolateTID, noRankTID, serogroupTID, serotypeTID, subspeciesTID)

   -- For now, let's import everything from NCBI Taxonomy, but we may want to limit this to just phages and viruses in the future.
   -- AND division.id IN (phagesDivisionTID, virusesDivisionTID);
   
END //

DELIMITER ;

