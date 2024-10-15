
DELIMITER //

DROP PROCEDURE IF EXISTS `searchTaxonHistogram`;

CREATE PROCEDURE `searchTaxonHistogram`(
	
	-- The maximum number of total symbol count differences.
	IN `maxCountDiff` INT,
	
	-- The maximum difference between the search text and test text.
	IN `maxLengthDiff` INT,
	
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

	-- Variables to store symbol counts.
	DECLARE aCount INT;
	DECLARE bCount INT; 
	DECLARE cCount INT; 
	DECLARE dCount INT; 
	DECLARE eCount INT; 
	DECLARE fCount INT; 
	DECLARE gCount INT; 
	DECLARE hCount INT; 
	DECLARE iCount INT; 
	DECLARE jCount INT; 
	DECLARE kCount INT; 
	DECLARE lCount INT; 
	DECLARE mCount INT; 
	DECLARE nCount INT; 
	DECLARE oCount INT; 
	DECLARE pCount INT; 
	DECLARE qCount INT; 
	DECLARE rCount INT; 
	DECLARE sCount INT; 
	DECLARE tCount INT; 
	DECLARE uCount INT; 
	DECLARE vCount INT; 
	DECLARE wCount INT; 
	DECLARE xCount INT; 
	DECLARE yCount INT; 
	DECLARE zCount INT; 
	DECLARE 1Count INT; 
	DECLARE 2Count INT; 
	DECLARE 3Count INT; 
	DECLARE 4Count INT; 
	DECLARE 5Count INT; 
	DECLARE 6Count INT; 
	DECLARE 7Count INT; 
	DECLARE 8Count INT; 
	DECLARE 9Count INT; 
	DECLARE 0Count INT; 
	DECLARE spaceCount INT;
	
	-- Trim whitespace from both ends of the search text and convert to lowercase.
	SET searchText = LOWER(TRIM(searchText));
	
	IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid search text parameter (empty)';
   END IF;
	
	-- Get the first character of the search text.
	SET firstCharacter = LEFT(searchText, 1);
	
	-- Get the length of the search text.
	SET searchTextLength = LENGTH(searchText);
	
	
	-- Calculate a count for every symbol.
	SET aCount = searchTextLength - LENGTH(REPLACE(searchText, 'a', ''));
	SET bCount = searchTextLength - LENGTH(REPLACE(searchText, 'b', ''));
	SET cCount = searchTextLength - LENGTH(REPLACE(searchText, 'c', ''));
	SET dCount = searchTextLength - LENGTH(REPLACE(searchText, 'd', ''));
	SET eCount = searchTextLength - LENGTH(REPLACE(searchText, 'e', ''));
	SET fCount = searchTextLength - LENGTH(REPLACE(searchText, 'f', ''));
	SET gCount = searchTextLength - LENGTH(REPLACE(searchText, 'g', ''));
	SET hCount = searchTextLength - LENGTH(REPLACE(searchText, 'h', ''));
	SET iCount = searchTextLength - LENGTH(REPLACE(searchText, 'i', ''));
	SET jCount = searchTextLength - LENGTH(REPLACE(searchText, 'j', ''));
	SET kCount = searchTextLength - LENGTH(REPLACE(searchText, 'k', ''));
	SET lCount = searchTextLength - LENGTH(REPLACE(searchText, 'l', ''));
	SET mCount = searchTextLength - LENGTH(REPLACE(searchText, 'm', ''));
	SET nCount = searchTextLength - LENGTH(REPLACE(searchText, 'n', ''));
	SET oCount = searchTextLength - LENGTH(REPLACE(searchText, 'o', ''));
	SET pCount = searchTextLength - LENGTH(REPLACE(searchText, 'p', ''));
	SET qCount = searchTextLength - LENGTH(REPLACE(searchText, 'q', ''));
	SET rCount = searchTextLength - LENGTH(REPLACE(searchText, 'r', ''));
	SET sCount = searchTextLength - LENGTH(REPLACE(searchText, 's', ''));
	SET tCount = searchTextLength - LENGTH(REPLACE(searchText, 't', ''));
	SET uCount = searchTextLength - LENGTH(REPLACE(searchText, 'u', ''));
	SET vCount = searchTextLength - LENGTH(REPLACE(searchText, 'v', ''));
	SET wCount = searchTextLength - LENGTH(REPLACE(searchText, 'w', ''));
	SET xCount = searchTextLength - LENGTH(REPLACE(searchText, 'x', ''));
	SET yCount = searchTextLength - LENGTH(REPLACE(searchText, 'y', ''));
	SET zCount = searchTextLength - LENGTH(REPLACE(searchText, 'z', ''));
	SET 1Count = searchTextLength - LENGTH(REPLACE(searchText, '1', ''));
	SET 2Count = searchTextLength - LENGTH(REPLACE(searchText, '2', ''));
	SET 3Count = searchTextLength - LENGTH(REPLACE(searchText, '3', ''));
	SET 4Count = searchTextLength - LENGTH(REPLACE(searchText, '4', ''));
	SET 5Count = searchTextLength - LENGTH(REPLACE(searchText, '5', ''));
	SET 6Count = searchTextLength - LENGTH(REPLACE(searchText, '6', ''));
	SET 7Count = searchTextLength - LENGTH(REPLACE(searchText, '7', ''));
	SET 8Count = searchTextLength - LENGTH(REPLACE(searchText, '8', ''));
	SET 9Count = searchTextLength - LENGTH(REPLACE(searchText, '9', ''));
	SET 0Count = searchTextLength - LENGTH(REPLACE(searchText, '0', ''));
	SET spaceCount = searchTextLength - LENGTH(REPLACE(searchText, ' ', ''));



	SELECT *
	FROM (
		SELECT 
			-- How many characters were different between the search text and match?
			maxCountDiff - count_diff AS accuracy_score,
			
			-- The NCBI division (phages, viruses)
			division,
			
			-- Prefer virus and phage results over anything else.
			CASE
				WHEN division IN ('viruses', 'phages') THEN 1 ELSE 0
			END AS division_score,
			
			-- Were the first characters of the search text and match the same?
			first_character_match,
			
			-- Prefer results that have an ICTV taxnode ID.
			CASE
				WHEN ictv_taxnode_id IS NOT NULL THEN 1 ELSE 0
			END AS has_taxnode_id,
				
			ictv_taxnode_id,
			
			-- Is this an exact match?
			is_exact_match,
			
			-- Is this a valid taxon (not obsolete)?
			is_valid,
			
			-- How much did the search text's length differ from the match's length?
			maxLengthDiff - length_diff AS size_score,
			
			-- The matching name
			`name`,
			
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
				WHEN taxonomy_db = 'ictv_taxonomy' THEN 3
				WHEN taxonomy_db = 'ictv_vmr' THEN 2
				WHEN taxonomy_db = 'ncbi_taxonomy' THEN 1
				ELSE 0
			END AS taxonomy_db_score,
			
			taxonomy_id,
			version_id,
			
			parent_taxonomy_db,
			parent_taxonomy_id
			
		FROM (
			
			SELECT
	
				-- The total number of symbol differences between the search text and taxon name.
				(
					ABS(aCount - _a) +
					ABS(bCount - _b) +
					ABS(cCount - _c) +
					ABS(dCount - _d) +
					ABS(eCount - _e) +
					ABS(fCount - _f) +
					ABS(gCount - _g) +
					ABS(hCount - _h) +
					ABS(iCount - _i) +
					ABS(jCount - _j) +
					ABS(kCount - _k) +
					ABS(lCount - _l) +
					ABS(mCount - _m) +
					ABS(nCount - _n) +
					ABS(oCount - _o) +
					ABS(pCount - _p) +
					ABS(qCount - _q) +
					ABS(rCount - _r) +
					ABS(sCount - _s) +
					ABS(tCount - _t) +
					ABS(uCount - _u) +
					ABS(vCount - _v) +
					ABS(wCount - _w) +
					ABS(xCount - _x) +
					ABS(yCount - _y) +
					ABS(zCount - _z) +
					ABS(1Count - _1) +
					ABS(2Count - _2) +
					ABS(3Count - _3) +
					ABS(4Count - _4) +
					ABS(5Count - _5) +
					ABS(6Count - _6) +
					ABS(7Count - _7) +
					ABS(8Count - _8) +
					ABS(9Count - _9) +
					ABS(0Count - _0) +
					ABS(spaceCount - _)
				) AS count_diff,
				
				-- Does the first character of the search text match the first character of the taxon name?
				CASE
					WHEN first_character = firstCharacter THEN 1 ELSE 0
				END AS first_character_match,
				
				CASE 
					WHEN filtered_text = searchText THEN 1 ELSE 0
				END AS is_exact_match,
				
				-- The difference in length between the search text and taxon name.
				ABS(searchTextLength - text_length) AS length_diff,
	
				-- The test record's taxon name ID.
				taxon_name_id
				
			FROM taxon_histogram
			
			-- Limit the number of results using differences in length.
			WHERE ABS(searchTextLength - text_length) <= maxLengthDiff
				
			
		) constrainedMatches
		
		JOIN v_taxon_name tn ON tn.id = taxon_name_id
		WHERE count_diff <= maxCountDiff
	
	) matchesWithinRange
	
	ORDER BY 
      is_exact_match DESC, 
      division_score DESC, 
      accuracy_score DESC, 
      size_score DESC, 
      is_valid DESC,
      name_class_score DESC,
      rank_score DESC,
      first_character_match DESC,
      has_taxnode_id DESC, 
      version_id DESC,
      taxonomy_db_score DESC
	
	LIMIT maxResultCount;
	
END//
DELIMITER ;