
DROP PROCEDURE IF EXISTS `QuerySearchableTaxon`;


DELIMITER //

-- Query the searchable_taxon table for the search text provided.

-- Updates
-- 01/09/25: Now excluding hidden and deleted taxonomy_node records.

CREATE PROCEDURE QuerySearchableTaxon(
	
   -- The current MSL release number.
   IN `currentMslRelease` INT,

   -- A version of the search text that might've been modified (based on the search modifier).
   IN `modifiedText` NVARCHAR(500),

   -- If search modifier = "starts_with", use MATCH AGAINST in the WHERE clause. If search modifier = "contains", use LIKE.
   IN `searchModifier` VARCHAR(20),

	-- Search for this text.
	IN `searchText` NVARCHAR(500)
)
BEGIN

   -- The first character in the search text.
	DECLARE firstCharacter VARCHAR(1);

	-- The length of the search text.
   DECLARE searchTextLength INT;
	
   -- Validate the modified text.
   IF modifiedText IS NULL OR LENGTH(modifiedText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid modified text parameter (empty)';
   END IF;

	-- Trim whitespace from both ends of the search text and convert to lowercase.
	SET searchText = TRIM(searchText);

	IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid search text parameter (empty)';
   END IF;
	
   IF searchModifier IS NULL THEN
      SET searchModifier = "any_words";
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

         -- The result's exemplar virus and its GenBank accession.
         si._isolate_name AS exemplar,
         si.genbank_accessions,

         -- The family of the ICTV result.
         CASE 
            WHEN result_tn.family_id IS NOT NULL THEN CONCAT(family.name, ':', CAST(result_tn.family_id AS VARCHAR(12)))
            ELSE ''
         END as family,

         -- The subfamily of the ICTV result.
         CASE 
            WHEN result_tn.subfamily_id IS NOT NULL THEN CONCAT(subfamily.name, ':', CAST(result_tn.subfamily_id AS VARCHAR(12)))
            ELSE ''
         END AS subfamily,

         -- The genus of the ICTV result.
         CASE 
            WHEN result_tn.genus_id IS NOT NULL THEN CONCAT(genus.name, ':', CAST(result_tn.genus_id AS VARCHAR(12)))
            ELSE ''
         END AS genus,

         -- The subgenus of the ICTV result.
         CASE 
            WHEN result_tn.subgenus_id IS NOT NULL THEN CONCAT(subgenus.name, ':', CAST(result_tn.subgenus_id AS VARCHAR(12)))
            ELSE ''
         END AS subgenus,

         -- Does the first character of the search text match the first character of the taxon name?
         CASE
            WHEN LEFT(st.name, 1) = firstCharacter THEN 1 ELSE 0
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
            WHEN st.name = searchText THEN 1 ELSE 0
         END AS is_exact_match,

         -- Is this a valid taxon (not obsolete)?
         st.is_valid,

         -- How much did the search text's length differ from the match's length?
         ABS(searchTextLength - LENGTH(st.name)) AS length_difference,

         -- Matching name
         st.name,

         -- Name class (inspired by NCBI name class).
         st.name_class,

         -- The taxonomic rank name
         st.rank_name AS rank_name,

         -- How recent is the ICTV result?
         ABS(currentMslRelease - result_tn.msl_release_num) AS recent_result_score,

         CASE 
            WHEN searchModifier IN ("all_words", "any_words", "exact_match") THEN MATCH(st.name) AGAINST(modifiedText IN BOOLEAN MODE)
            ELSE 1
         END AS relevance_score,

         -- Result columns
         result_tn.msl_release_num AS result_msl_release,
         result_tn.name AS result_name,
         result_tn.rank_name AS result_rank_name,
         result_tn.taxnode_id AS result_taxnode_id,

         -- A score for the result rank for use in sorting the results.
         CASE
            WHEN result_tn.rank_name IS NULL THEN 25
            WHEN result_tn.rank_name IN ('no rank','tree') THEN 0
            WHEN result_tn.rank_name = 'realm' THEN 1
            WHEN result_tn.rank_name = 'subrealm' THEN 2
            WHEN result_tn.rank_name = 'superkingdom' THEN 3
            WHEN result_tn.rank_name = 'kingdom' THEN 4
            WHEN result_tn.rank_name = 'subkingdom' THEN 5
            WHEN result_tn.rank_name = 'phylum' THEN 6
            WHEN result_tn.rank_name = 'subphylum' THEN 7
            WHEN result_tn.rank_name = 'class' THEN 8
            WHEN result_tn.rank_name = 'subclass' THEN 9
            WHEN result_tn.rank_name = 'order' THEN 10
            WHEN result_tn.rank_name = 'suborder' THEN 11
            WHEN result_tn.rank_name = 'family' THEN 12
            WHEN result_tn.rank_name = 'subfamily' THEN 13
            WHEN result_tn.rank_name = 'genus' THEN 14
            WHEN result_tn.rank_name = 'subgenus' THEN 15
            WHEN result_tn.rank_name = 'species' THEN 16
            WHEN result_tn.rank_name = 'species group' THEN 17
            WHEN result_tn.rank_name = 'species subgroup' THEN 18
            WHEN result_tn.rank_name = 'subspecies' THEN 19
            WHEN result_tn.rank_name = 'serogroup' THEN 20
            WHEN result_tn.rank_name = 'serotype' THEN 21
            WHEN result_tn.rank_name = 'genotype' THEN 22
            WHEN result_tn.rank_name = 'strain' THEN 23
            WHEN result_tn.rank_name = 'isolate' THEN 24
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
      LEFT JOIN v_taxonomy_node_merge_split ms ON (
         ms.prev_ictv_id = st.ictv_id 
         AND ms.rev_count = 0
      )
      LEFT JOIN latest_release_of_ictv_id lr_result ON lr_result.ictv_id = ms.next_ictv_id 
      LEFT JOIN v_taxonomy_node_names result_tn ON (
         result_tn.ictv_id = ms.next_ictv_id 
         AND result_tn.msl_release_num = lr_result.latest_msl_release
      ) 
      LEFT JOIN v_species_isolates si ON (
         si.taxnode_id = result_tn.taxnode_id
         AND si.isolate_type = 'E'
      )
      LEFT JOIN v_taxonomy_node family on family.taxnode_id = result_tn.family_id 
      LEFT JOIN v_taxonomy_node subfamily on subfamily.taxnode_id = result_tn.subfamily_id 
      LEFT JOIN v_taxonomy_node genus on genus.taxnode_id = result_tn.genus_id 
      LEFT JOIN v_taxonomy_node subgenus on subgenus.taxnode_id = result_tn.subgenus_id 

      WHERE (searchModifier IN ("all_words", "any_words", "exact_match") AND MATCH(st.name) AGAINST(modifiedText IN BOOLEAN MODE))
      OR (searchModifier = "contains" AND st.name LIKE modifiedText)
      LIMIT 10000
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
      result_rank_score ASC,
      result_msl_release DESC,
      result_name ASC,
      taxonomy_db_score DESC,
      version_id DESC,
      name ASC;
      
	
END//
DELIMITER ;