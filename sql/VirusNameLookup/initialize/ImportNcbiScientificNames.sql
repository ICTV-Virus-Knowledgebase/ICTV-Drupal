
DROP PROCEDURE IF EXISTS `ImportNcbiScientificNames`;

DELIMITER //

CREATE PROCEDURE ImportNcbiScientificNames()
BEGIN

   DECLARE genotypeTID INT;
   DECLARE isolateTID INT;
   DECLARE ncbiTaxDbTID INT;
   DECLARE noRankTID INT;
   DECLARE serogroupTID INT;
   DECLARE serotypeTID INT;
   DECLARE subspeciesTID INT;
   

   -- Lookup the term ID for the NCBI taxonomy database.
   SET ncbiTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for taxonomy_db.ncbi_taxonomy';
   END IF;

   -- Lookup term IDs for subspecies rank names.
   SET genotypeTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.genotype' LIMIT 1);
   IF genotypeTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for genotype taxonomy rank';
   END IF;

   SET isolateTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.isolate' LIMIT 1);
   IF isolateTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for isolate taxonomy rank';
   END IF;

   SET noRankTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.no_rank' LIMIT 1);
   IF noRankTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for "no rank" taxonomy rank';
   END IF;

   SET serogroupTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.serogroup' LIMIT 1);
   IF serogroupTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for serogroup taxonomy rank';
   END IF;

   SET serotypeTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.serotype' LIMIT 1);
   IF serotypeTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for serotype taxonomy rank';
   END IF;

   SET subspeciesTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.subspecies' LIMIT 1);
   IF subspeciesTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for subspecies taxonomy rank';
   END IF; 


   -- Create the new searchable_taxon records.
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
      division.id AS division_tid,
      getFilteredName(nname.name_txt) AS filtered_name,
      latestTN.ictv_id,
      latestTN.latestTaxnodeID AS ictv_taxnode_id,
      nname.name_txt,
      nname.name_class_tid,
      ncbiTaxDbTID AS parent_taxonomy_db_tid,
      nnode.parent_tax_id AS parent_taxonomy_id,
      nnode.rank_name_tid,
      ncbiTaxDbTID AS taxonomy_db_tid,
      nnode.tax_id AS taxonomy_id,
      1 AS version_id

   FROM ncbi_node nnode
   JOIN ncbi_name nname ON nname.tax_id = nnode.tax_id
   JOIN ncbi_division d ON d.id = nnode.division_id
   JOIN term division ON division.label = d.name
   LEFT JOIN (
      SELECT 
         DISTINCT tn.name,
         tn.ictv_id,
         (
            SELECT tnid.taxnode_id
            FROM v_taxonomy_node tnid
            WHERE tnid.name = tn.name
            AND tnid.msl_release_num IS NOT NULL
            ORDER BY tnid.msl_release_num DESC
            LIMIT 1
         ) AS latestTaxnodeID
      FROM v_taxonomy_node tn
      JOIN v_taxonomy_level tl ON tl.id = tn.level_id
      WHERE tn.taxnode_id <> tn.tree_id
      AND tn.msl_release_num IS NOT NULL
   ) latestTN ON latestTN.name = nname.name_txt

   -- Exclude subspecies ranks
   WHERE nnode.rank_name_tid NOT IN (genotypeTID, isolateTID, noRankTID, serogroupTID, serotypeTID, subspeciesTID)

   -- Limit the NCBI divisions to include.
   AND division.full_key IN (
      'ncbi_division.bacteria', 
      'ncbi_division.phages', 
      'ncbi_division.synthetic_and_chimeric', 
      'ncbi_division.viruses', 
      'ncbi_division.environmental_samples'
   );

END //

DELIMITER ;

