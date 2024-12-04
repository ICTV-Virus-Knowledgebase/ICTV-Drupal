
DROP PROCEDURE IF EXISTS `QuerySearchableTaxon`;


DELIMITER //

CREATE PROCEDURE QuerySearchableTaxon(
	
   -- The current MSL release number.
   IN `currentMslRelease` INT,

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
	
   -- dmd test
   DECLARE abbreviationTID INT;
   DECLARE acronymTID INT;
   DECLARE blastNameTID INT;
   DECLARE commonNameTID INT;
   DECLARE epithetsTaxDbTID INT;
   DECLARE equivalentNameTID INT;
   DECLARE genbankAccessionTID INT;
   DECLARE genbankAcronymTID INT;
   DECLARE genbankCommonNameTID INT;
   DECLARE ictvTaxDbTID INT;
   DECLARE isolateAbbreviationTID INT;
   DECLARE isolateDesignationTID INT;
   DECLARE isolateExemplarTID INT;
   DECLARE isolateNameTID INT;
   DECLARE ncbiTaxDbTID INT;
   DECLARE phageDivTID INT;
   DECLARE refseqAccessionTID INT;        
   DECLARE scientificNameTID INT;
   DECLARE synonymTID INT;
   DECLARE virusDivTID INT;
   DECLARE vmrTaxDbTID INT;

	-- Trim whitespace from both ends of the search text and convert to lowercase.
	SET searchText = LOWER(TRIM(searchText));

	IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid search text parameter (empty)';
   END IF;
	
   -- Get the first character of the search text.
	SET firstCharacter = LEFT(searchText, 1);
	
	-- Get the length of the search text.
	SET searchTextLength = LENGTH(searchText);
	

	WITH searchResults AS (

      SELECT

         -- Match columns

         -- NCBI division (phages, viruses)
         st.division,

         -- Prefer virus and phage results over anything else.
         CASE
            WHEN st.division IN ('viruses', 'phages') THEN 1 ELSE 0
         END AS division_score,

         -- Does the first character of the search text match the first character of the taxon name?
         CASE
            WHEN LEFT(st.filtered_name, 1) = firstCharacter THEN 1 ELSE 0
         END AS first_character_match,

         -- Does the matching taxon have an associated ICTV result?
         CASE 
            WHEN result_tn.taxnode_id IS NOT NULL AND result_tn.taxnode_id > 0 THEN 1 ELSE 0
         END AS has_taxnode_id,

         -- ICTV ID
         st.ictv_id AS ictv_id,

         -- An intermediate scientific name (for NCBI Taxonomy only).
         st.intermediate_name,
         st.intermediate_rank,
         
         -- Is this an exact match?
         CASE 
            WHEN st.filtered_name = searchText THEN 1 ELSE 0
         END AS is_exact_match,

         -- Is this a valid taxon (not obsolete)?
         st.is_valid,

         -- How much did the search text's length differ from the match's length?
         ABS(searchTextLength - LENGTH(st.filtered_name)) AS length_difference,

         -- Matching name
         st.name,

         -- Name class (inspired by NCBI name class).
         st.name_class,

         -- Name classes ordered from most specific to least specific.
         CASE
            WHEN st.name_class IN ('genbank_accession', 'refseq_accession') THEN 10
            WHEN st.name_class IN ('isolate_name', 'isolate_exemplar') THEN 9
            WHEN st.name_class IN ('isolate_abbreviation', 'genbank_acronym') THEN 8
            WHEN st.name_class = 'scientific_name' THEN 7
            WHEN st.name_class IN ('synonym', 'equivalent_name') THEN 6
            WHEN st.name_class = 'genbank_common_name' THEN 5
            WHEN st.name_class = 'common_name' THEN 4
            WHEN st.name_class = 'blast_name' THEN 3
            WHEN st.name_class IN ('abbreviation', 'acronym') THEN 2
            WHEN st.name_class = 'isolate_designation' THEN 1
            ELSE 0
         END AS name_class_score,

         st.rank_name AS rank_name,

         -- Ranks found in ICTV, VMR, and NCBI Taxonomy (virus and phage divisions only).
         -- Prefer lower ranks over higher ranks.
         CASE
            WHEN st.rank_name IN ('no rank','tree') THEN 0
            WHEN st.rank_name = 'realm' THEN 1
            WHEN st.rank_name = 'subrealm' THEN 2
            WHEN st.rank_name = 'superkingdom' THEN 3
            WHEN st.rank_name = 'kingdom' THEN 4
            WHEN st.rank_name = 'subkingdom' THEN 5
            WHEN st.rank_name = 'phylum' THEN 6
            WHEN st.rank_name = 'subphylum' THEN 7
            WHEN st.rank_name = 'class' THEN 8
            WHEN st.rank_name = 'subclass' THEN 9
            WHEN st.rank_name = 'order' THEN 10
            WHEN st.rank_name = 'suborder' THEN 11
            WHEN st.rank_name = 'family' THEN 12
            WHEN st.rank_name = 'subfamily' THEN 13
            WHEN st.rank_name = 'genus' THEN 14
            WHEN st.rank_name = 'subgenus' THEN 15
            WHEN st.rank_name = 'species' THEN 16
            WHEN st.rank_name = 'species group' THEN 17
            WHEN st.rank_name = 'species subgroup' THEN 18
            WHEN st.rank_name = 'subspecies' THEN 19
            WHEN st.rank_name = 'serogroup' THEN 20
            WHEN st.rank_name = 'serotype' THEN 21
            WHEN st.rank_name = 'genotype' THEN 22
            WHEN st.rank_name = 'strain' THEN 23
            WHEN st.rank_name = 'isolate' THEN 24
            ELSE 0
         END AS rank_score,

         -- How recent is the ICTV result?
         ABS(currentMslRelease - result_tn.msl_release_num) AS recent_result_score,

         -- Result columns
         result_tn.msl_release_num AS result_msl_release,
         result_tn.name AS result_name,
         tl_result.name AS result_rank_name,
         result_tn.taxnode_id AS result_taxnode_id,

         -- A score for the result rank for use in sorting the results.
         CASE
            WHEN tl_result.name IS NULL THEN 25
            WHEN tl_result.name IN ('no rank','tree') THEN 0
            WHEN tl_result.name = 'realm' THEN 1
            WHEN tl_result.name = 'subrealm' THEN 2
            WHEN tl_result.name = 'superkingdom' THEN 3
            WHEN tl_result.name = 'kingdom' THEN 4
            WHEN tl_result.name = 'subkingdom' THEN 5
            WHEN tl_result.name = 'phylum' THEN 6
            WHEN tl_result.name = 'subphylum' THEN 7
            WHEN tl_result.name = 'class' THEN 8
            WHEN tl_result.name = 'subclass' THEN 9
            WHEN tl_result.name = 'order' THEN 10
            WHEN tl_result.name = 'suborder' THEN 11
            WHEN tl_result.name = 'family' THEN 12
            WHEN tl_result.name = 'subfamily' THEN 13
            WHEN tl_result.name = 'genus' THEN 14
            WHEN tl_result.name = 'subgenus' THEN 15
            WHEN tl_result.name = 'species' THEN 16
            WHEN tl_result.name = 'species group' THEN 17
            WHEN tl_result.name = 'species subgroup' THEN 18
            WHEN tl_result.name = 'subspecies' THEN 19
            WHEN tl_result.name = 'serogroup' THEN 20
            WHEN tl_result.name = 'serotype' THEN 21
            WHEN tl_result.name = 'genotype' THEN 22
            WHEN tl_result.name = 'strain' THEN 23
            WHEN tl_result.name = 'isolate' THEN 24
            ELSE 25
         END AS result_rank_score,

         -- The match's taxonomy database
         st.taxonomy_db AS taxonomy_db,

         -- Taxonomy databases in order of preference.
         CASE
            WHEN st.taxonomy_db = 'ictv_taxonomy' THEN 4
            WHEN st.taxonomy_db = 'ictv_epithets' THEN 3
            WHEN st.taxonomy_db = 'ictv_vmr' THEN 2
            WHEN st.taxonomy_db = 'ncbi_taxonomy' THEN 1
            ELSE 0
         END AS taxonomy_db_score,

         st.taxonomy_id AS taxonomy_id,
         st.version_id AS version_id


      FROM v_searchable_taxon st
      LEFT JOIN v_taxonomy_node_merge_split ms ON ms.prev_ictv_id = st.ictv_id
      LEFT JOIN latest_release_of_ictv_id lr_match ON (
         lr_match.ictv_id = ms.prev_ictv_id 
         AND lr_match.latest_msl_release = st.version_id
      )
      LEFT JOIN latest_release_of_ictv_id lr_result ON lr_result.ictv_id = ms.next_ictv_id 
      LEFT JOIN v_taxonomy_node result_tn ON (
         result_tn.ictv_id = ms.next_ictv_id 
         AND result_tn.msl_release_num = lr_result.latest_msl_release
      ) 
      LEFT JOIN v_taxonomy_level tl_result ON tl_result.id = result_tn.level_id 
      WHERE MATCH(st.filtered_name) AGAINST(CONCAT('*', searchText, '*') IN BOOLEAN MODE)
   )

   SELECT *
   FROM searchResults sr_outer
   WHERE sr_outer.result_msl_release = (
      SELECT sr_inner.result_msl_release 
      FROM searchResults sr_inner
      WHERE sr_inner.ictv_id = sr_outer.ictv_id
      ORDER BY sr_inner.result_msl_release DESC 
      LIMIT 1
   ) OR sr_outer.result_msl_release IS NULL
   ORDER BY 
      is_exact_match DESC,
      result_rank_score ASC,
      result_name ASC,
      taxonomy_db_score DESC,
      name ASC;
      
	-- LIMIT maxResultCount; 
	
END//
DELIMITER ;