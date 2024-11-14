
DROP PROCEDURE IF EXISTS `ImportNcbiSubspeciesNodes`;

DELIMITER //

CREATE PROCEDURE ImportNcbiSubspeciesNodes()
BEGIN

   DECLARE genotypeTID INT;
   DECLARE ictvID INT;
   DECLARE isolateTID INT;
   DECLARE ncbiTaxDbTID INT;
   DECLARE noRankTID INT;
   DECLARE phagesDivisionTID INT;
   DECLARE sciNameClassTID INT;
   DECLARE serogroupTID INT;
   DECLARE serotypeTID INT;
   DECLARE subspeciesTID INT;
   DECLARE superkingdomTID INT;
   DECLARE virusesDivisionTID INT;


   -- Lookup the term ID for the "scientific name" name class.
   SET sciNameClassTID = (SELECT id FROM term WHERE full_key = 'name_class.scientific_name' LIMIT 1);
   IF sciNameClassTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for name_class.scientific_name';
   END IF;

   -- Lookup the term ID for the NCBI taxonomy database.
   SET ncbiTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
   IF ncbiTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for taxonomy_db.ncbi_taxonomy';
   END IF;

   -- Lookup term IDs for NCBI divisions.
   SET phagesDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.phages' LIMIT 1);
   IF phagesDivisionTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for ncbi_division.phages';
   END IF;

   SET virusesDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.viruses' LIMIT 1);
   IF virusesDivisionTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for ncbi_division.viruses';
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

   -- Lookup the term ID for taxonomic rank "superkingdom".
   SET superkingdomTID = (SELECT id FROM term WHERE full_key = 'taxonomy_rank.superkingdom' LIMIT 1);
   IF superkingdomTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for superkingdom taxonomy rank';
   END IF; 


   -- Create the new searchable_taxon records.
	INSERT INTO searchable_taxon (
		division_tid,
		filtered_name,
      ictv_id,
      ictv_taxnode_id,
      intermediate_name,
      intermediate_rank,
		`name`,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	)

   -- Return subspecies NCBI taxa along with a possible match in ICTV taxonomy.
   SELECT
      CASE
         WHEN subspeciesNode.division_id = 3 THEN phagesDivisionTID
         WHEN subspeciesNode.division_id = 9 THEN virusesDivisionTID
         ELSE NULL
      END AS division_tid,
      getFilteredName(subspeciesName.name_txt) AS filtered_name,
      latestTN.ictv_id,
      latestTN.latestTaxnodeID AS ictv_taxnode_id,
      parentName.name_txt,
      parentNode.rank_name,
      subspeciesName.name_txt,
      subspeciesName.name_class_tid,
      ncbiTaxDbTID AS parent_taxonomy_db_tid,
      subspeciesNode.parent_tax_id AS parent_taxonomy_id,
      subspeciesNode.rank_name_tid,
      ncbiTaxDbTID AS taxonomy_db_tid,
      subspeciesNode.tax_id AS taxonomy_id,
      1 AS version_id

   FROM ncbi_node subspeciesNode
   JOIN ncbi_name subspeciesName ON subspeciesName.tax_id = subspeciesNode.tax_id
   JOIN ncbi_node parentNode ON parentNode.tax_id = subspeciesNode.subspecies_parent_tax_id
   JOIN ncbi_name parentName ON parentName.tax_id = parentNode.tax_id
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
   ) latestTN ON latestTN.name = parentName.name_txt

   -- Only include subspecies ranks
   WHERE subspeciesNode.rank_name_tid IN (genotypeTID, isolateTID, noRankTID, serogroupTID, serotypeTID, subspeciesTID)
   AND subspeciesNode.subspecies_parent_tax_id IS NOT NULL

   -- Parent names should only be scientific names.
   AND parentName.name_class_tid = sciNameClassTID

   -- Only include phages and viruses.
   AND subspeciesNode.division_id IN (3, 9)
   
   -- Exclude results immediately below superkingdom.
   AND parentNode.rank_name_tid <> superkingdomTID;

END //

DELIMITER ;

