
DELIMITER //

DROP PROCEDURE IF EXISTS `searchTaxonName`;

CREATE PROCEDURE `searchTaxonName`(
	
	-- The maximum number of results to return.
	IN `maxResultCount` INT,
	
	-- Search for this text.
	IN `searchText` NVARCHAR(500)
)
BEGIN

   -- The first character in the search text.
	DECLARE firstCharacter VARCHAR(1);

	-- The length of the search text.
   DECLARE searchTextLength INT;
	
	-- Trim whitespace from both ends of the search text and convert to lowercase.
	SET searchText = LOWER(TRIM(searchText));
	
	IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid search text parameter (empty)';
   END IF;
	
   -- Get the first character of the search text.
	SET firstCharacter = LEFT(searchText, 1);
	
	-- Get the length of the search text.
	SET searchTextLength = LENGTH(searchText);
	
	
	SELECT *
	FROM (
      SELECT
         -- The NCBI division (phages, viruses)
         division,

         -- Prefer virus and phage results over anything else.
         CASE
            WHEN division IN ('viruses', 'phages') THEN 1 ELSE 0
         END AS division_score,

         filtered_name,

         -- Does the first character of the search text match the first character of the taxon name?
         CASE
            WHEN LEFT(filtered_name, 1) = firstCharacter THEN 1 ELSE 0
         END AS first_character_match,
         
         -- Prefer results that have an ICTV taxnode ID.
         CASE
            WHEN ictv_taxnode_id IS NOT NULL THEN 1 ELSE 0
         END AS has_taxnode_id,

         ictv_msl_release,
         ictv_name,
         ictv_rank_name,
         ictv_taxnode_id,

         -- Is this an exact match?
         CASE 
            WHEN filtered_name = searchText THEN 1 ELSE 0
         END AS is_exact_match,

         -- Is this a valid taxon (not obsolete)?
         is_valid,

         -- How much did the search text's length differ from the match's length?
         ABS(searchTextLength - LENGTH(filtered_name)) AS length_difference,
      
         -- The matching name
         name,
         
         -- The name class/type, inspired by NCBI name class.
         name_class,

         -- Name classes ordered from most specific to least specific.
         CASE
            WHEN name_class IN ('genbank_accession', 'refseq_accession') THEN 10
            WHEN name_class IN ('isolate_name', 'isolate_exemplar') THEN 9
            WHEN name_class IN ('isolate_abbreviation', 'genbank_acronym') THEN 8
            WHEN name_class = 'scientific_name' THEN 7
            WHEN name_class IN ('synonym, equivalent_name') THEN 6
            WHEN name_class = 'genbank_common_name' THEN 5
            WHEN name_class = 'common_name' THEN 4
            WHEN name_class = 'blast_name' THEN 3
            WHEN name_class IN ('abbreviation', 'acronym') THEN 2
            WHEN name_class = 'isolate_designation' THEN 1
            ELSE 0
         END AS name_class_score,

         parent_taxonomy_db,
         parent_taxonomy_id,
         rank_name,

         -- Ranks found in ICTV, VMR, and NCBI Taxonomy (virus and phage divisions only).
         -- Prefer lower ranks over higher ranks.
         CASE
            WHEN rank_name IN ('no rank','tree') THEN 0
            WHEN rank_name = 'realm' THEN 1
            WHEN rank_name = 'subrealm' THEN 2
            WHEN rank_name = 'superkingdom' THEN 3
            WHEN rank_name = 'kingdom' THEN 4
            WHEN rank_name = 'subkingdom' THEN 5
            WHEN rank_name = 'phylum' THEN 6
            WHEN rank_name = 'subphylum' THEN 7
            WHEN rank_name = 'class' THEN 8
            WHEN rank_name = 'subclass' THEN 9
            WHEN rank_name = 'order' THEN 10
            WHEN rank_name = 'suborder' THEN 11
            WHEN rank_name = 'family' THEN 12
            WHEN rank_name = 'subfamily' THEN 13
            WHEN rank_name = 'genus' THEN 14
            WHEN rank_name = 'subgenus' THEN 15
            WHEN rank_name = 'species' THEN 16
            WHEN rank_name = 'species group' THEN 17
            WHEN rank_name = 'species subgroup' THEN 18
            WHEN rank_name = 'subspecies' THEN 19
            WHEN rank_name = 'serogroup' THEN 20
            WHEN rank_name = 'serotype' THEN 21
            WHEN rank_name = 'genotype' THEN 22
            WHEN rank_name = 'strain' THEN 23
            WHEN rank_name = 'isolate' THEN 24
            ELSE 0
         END AS rank_score,

         taxonomy_db,

         -- Taxonomy databases in order of preference.
         CASE
            WHEN taxonomy_db = 'ictv_taxonomy' THEN 4
            WHEN taxonomy_db = 'ictv_species_lookup' THEN 3
            WHEN taxonomy_db = 'ictv_vmr' THEN 2
            WHEN taxonomy_db = 'ncbi_taxonomy' THEN 1
            ELSE 0
         END AS taxonomy_db_score,

         taxonomy_id,

         -- The match's taxon name ID.
         id AS taxon_name_id,

         version_id
         
      FROM v_taxon_name
      WHERE filtered_name LIKE CONCAT('%', searchText, '%')
   ) results
   
   ORDER BY 
      is_exact_match DESC, 
      first_character_match DESC,
      length_difference ASC,
      taxonomy_db_score DESC,
      version_id DESC
	
	LIMIT maxResultCount;
	
END//
DELIMITER ;