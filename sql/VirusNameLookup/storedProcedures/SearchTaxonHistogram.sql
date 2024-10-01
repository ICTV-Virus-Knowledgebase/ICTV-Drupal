
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
			countDiff,
			division,
			firstCharacterMatch,
			isExactMatch,
			is_valid,
			lengthDiff,
			`name`,
			name_class,
			
			CASE
			
				WHEN name_class = 'isolate_name' THEN 12
				WHEN name_class = 'isolate_exemplar' THEN 11

				WHEN name_class = 'scientific_name' THEN 10
				WHEN name_class IN ('synonym', 'equivalent_name') THEN 9
				
				WHEN name_class = 'genbank_common_name' THEN 8
				WHEN name_class = 'common_name' THEN 7
				WHEN name_class = 'blast_name' THEN 6
				
				WHEN name_class = 'isolate_designation' THEN 5
				
				WHEN name_class IN ('isolate_abbreviation', 'genbank_acronym') THEN 4
				WHEN name_class IN ('abbreviation', 'acronym') THEN 3
				
				WHEN name_class = 'genbank_accession' THEN 2
				WHEN name_class = 'refseq_accession' THEN 1
				ELSE 0

			END AS name_class_score,
			
			
			rank_name,
			
			-- Prefer lower ranks over higher ranks.
			CASE
				WHEN rank_name IN ('no rank', 'clade') THEN 0
				WHEN rank_name = 'superkingdom' THEN 1
				WHEN rank_name = 'kingdom' THEN 2
				WHEN rank_name = 'phylum' THEN 3
				WHEN rank_name = 'subphylum' THEN 4
				WHEN rank_name = 'class' THEN 5
				WHEN rank_name = 'subclass' THEN 6
				WHEN rank_name = 'order' THEN 7
				WHEN rank_name = 'suborder' THEN 8
				WHEN rank_name = 'family' THEN 9
				WHEN rank_name = 'subfamily' THEN 10
				WHEN rank_name = 'genus' THEN 11
				WHEN rank_name = 'subgenus' THEN 12
				WHEN rank_name = 'species group' THEN 13
				WHEN rank_name = 'species' THEN 14
				WHEN rank_name IN ('subspecies, species subgroup') THEN 15
				WHEN rank_name = 'strain' THEN 16
				WHEN rank_name = 'isolate' THEN 17
				
				-- Where do these go?
				WHEN rank_name = 'genotype' THEN 18
				WHEN rank_name = 'serogroup' THEN 19
				WHEN rank_name = 'serotype' THEN 20 
				
				ELSE -1
				
				/*
				-- ???
				biotype
				forma
				forma specialis
				pathogroup
				tribe
				varietas
				*/
			
			END AS rank_score,
			
			taxonomy_db,
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
				) AS countDiff,
				
				-- Does the first character of the search text match the first character of the taxon name?
				CASE
					WHEN first_character = firstCharacter THEN 1 ELSE 0
				END AS firstCharacterMatch,
				
				CASE 
					WHEN filtered_text = searchText THEN 1 ELSE 0
				END AS isExactMatch,
				
				-- The difference in length between the search text and taxon name.
				ABS(searchTextLength - text_length) AS lengthDiff,
	
				-- The test record's taxon name ID.
				taxon_name_id
				
			FROM taxon_histogram
			
			
			-- Limit the number of results using differences in length.
			WHERE ABS(searchTextLength - text_length) <= maxLengthDiff
				
			
		) constrainedMatches
		
		JOIN v_taxon_name tn ON tn.id = taxon_name_id
		WHERE countDiff <= maxCountDiff
	
	) matchesWithinRange
	
	ORDER BY isExactMatch DESC, firstCharacterMatch DESC, countDiff ASC, lengthDiff ASC, version_id DESC, is_valid DESC
	
	LIMIT maxResultCount;
	
END//
DELIMITER ;