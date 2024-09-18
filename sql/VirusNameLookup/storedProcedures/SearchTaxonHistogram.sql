
DELIMITER //

DROP PROCEDURE IF EXISTS `searchTaxonHistogram`;

CREATE PROCEDURE `searchTaxonHistogram`(

	-- Successful symbol counts will be within the range from symbolCount - countVariance to symbolCount + countVariance.
	IN `countVariance` INT,
	
	-- Successful text lengths will be within the range from textLength - lengthVariance to textLength + lengthVariance.
	IN `lengthVariance` INT,
	
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


	SELECT 
		division,
		first_character_match,
		is_exact_match,
		is_valid,
		length_diff,
		length_within_range,
		`name`,
		name_class,
		rank_name,
		taxonomy_db,
		taxonomy_id,
		total_count_diff,
		version_id
		
	FROM (
		SELECT *,
		
			-- Add symbol diffs to calculate the total count diff.
			(aDiff + bDiff + cDiff + dDiff + eDiff + fDiff + gDiff + hDiff + iDiff + jDiff + 
			kDiff + lDiff + mDiff + nDiff + oDiff + pDiff + qDiff + rDiff + sDiff + tDiff + 
			uDiff + vDiff + wDiff + xDiff + yDiff + zDiff + 1Diff + 2Diff + 3Diff + 4Diff + 
			5Diff + 6Diff + 7Diff + 8Diff + 9Diff + 0Diff + spaceDiff) AS total_count_diff,
			
			CASE
				-- If the length difference is 0, the length is definitely within range.
				WHEN length_diff = 0 THEN 1
				
				-- Is the difference between the search text and test text length within the allowable range?
				WHEN length_diff >= (searchTextLength - lengthVariance) AND length_diff <= (searchTextLength + lengthVariance) THEN 1 
				
				ELSE 0
				
			END AS length_within_range
			
		FROM (
			
			SELECT

				-- Does the first character of the search text match the first character in the test row?
				CASE
					WHEN first_character = firstCharacter THEN 1 ELSE 0
				END AS first_character_match,
				
				CASE 
					WHEN filtered_text = searchText THEN 1 ELSE 0
				END AS is_exact_match,
				
				-- The difference in length between the search text and test record.
				ABS(searchTextLength - text_length) AS length_diff,

				/* 
				For every character:
				- The number of occurrences in the test record.
				- The number of occurrences in the search text.
				- The difference between the test record and search text counts.	
				*/
				_a, aCount, ABS(aCount - _a) AS aDiff, 
				_b, bCount, ABS(bCount - _b) AS bDiff, 
				_c, cCount, ABS(cCount - _c) AS cDiff, 
				_d, dCount, ABS(dCount - _d) AS dDiff, 
				_e, eCount, ABS(eCount - _e) AS eDiff, 
				_f, fCount, ABS(fCount - _f) AS fDiff, 
				_g, gCount, ABS(gCount - _g) AS gDiff, 
				_h, hCount, ABS(hCount - _h) AS hDiff, 
				_i, iCount, ABS(iCount - _i) AS iDiff, 
				_j, jCount, ABS(jCount - _j) AS jDiff, 
				_k, kCount, ABS(kCount - _k) AS kDiff, 
				_l, lCount, ABS(lCount - _l) AS lDiff, 
				_m, mCount, ABS(mCount - _m) AS mDiff, 
				_n, nCount, ABS(nCount - _n) AS nDiff, 
				_o, oCount, ABS(oCount - _o) AS oDiff, 
				_p, pCount, ABS(pCount - _p) AS pDiff, 
				_q, qCount, ABS(qCount - _q) AS qDiff, 
				_r, rCount, ABS(rCount - _r) AS rDiff, 
				_s, sCount, ABS(sCount - _s) AS sDiff, 
				_t, tCount, ABS(tCount - _t) AS tDiff, 
				_u, uCount, ABS(uCount - _u) AS uDiff, 
				_v, vCount, ABS(vCount - _v) AS vDiff, 
				_w, wCount, ABS(wCount - _w) AS wDiff, 
				_x, xCount, ABS(xCount - _x) AS xDiff, 
				_y, yCount, ABS(yCount - _y) AS yDiff, 
				_z, zCount, ABS(zCount - _z) AS zDiff, 
				_1, 1Count, ABS(1Count - _1) AS 1Diff, 
				_2, 2Count, ABS(2Count - _2) AS 2Diff, 
				_3, 3Count, ABS(3Count - _3) AS 3Diff, 
				_4, 4Count, ABS(4Count - _4) AS 4Diff, 
				_5, 5Count, ABS(5Count - _5) AS 5Diff, 
				_6, 6Count, ABS(6Count - _6) AS 6Diff, 
				_7, 7Count, ABS(7Count - _7) AS 7Diff, 
				_8, 8Count, ABS(8Count - _8) AS 8Diff, 
				_9, 9Count, ABS(9Count - _9) AS 9Diff, 
				_0, 0Count, ABS(0Count - _0) AS 0Diff, 
				_, 
				spaceCount, 
				ABS(spaceCount - _) AS spaceDiff,
				
				-- The test record's taxon name ID.
				taxon_name_id
				
			FROM taxon_histogram
			
			
			WHERE
				-- If the search text and filtered text are an exact match, there's no need to check the other constraints.
				searchText = filtered_text
				
				OR (
			
					-- The difference between the search text length and test text length must be <= the maxLengthDiff value.
					(ABS(searchTextLength - text_length) <= maxLengthDiff) AND
					
					-- For a given symbol, the test count must be within the range of the search count +/- countVariance.
					(_a >= aCount - countVariance AND _a <= aCount + countVariance) AND 
					(_b >= bCount - countVariance AND _b <= bCount + countVariance) AND 
					(_c >= cCount - countVariance AND _c <= cCount + countVariance) AND 
					(_d >= dCount - countVariance AND _d <= dCount + countVariance) AND 
					(_e >= eCount - countVariance AND _e <= eCount + countVariance) AND 
					(_f >= fCount - countVariance AND _f <= fCount + countVariance) AND 
					(_g >= gCount - countVariance AND _g <= gCount + countVariance) AND 
					(_h >= hCount - countVariance AND _h <= hCount + countVariance) AND 
					(_i >= iCount - countVariance AND _i <= iCount + countVariance) AND 
					(_j >= jCount - countVariance AND _j <= jCount + countVariance) AND 
					(_k >= kCount - countVariance AND _k <= kCount + countVariance) AND 
					(_l >= lCount - countVariance AND _l <= lCount + countVariance) AND 
					(_m >= mCount - countVariance AND _m <= mCount + countVariance) AND 
					(_n >= nCount - countVariance AND _n <= nCount + countVariance) AND 
					(_o >= oCount - countVariance AND _o <= oCount + countVariance) AND 
					(_p >= pCount - countVariance AND _p <= pCount + countVariance) AND 
					(_q >= qCount - countVariance AND _q <= qCount + countVariance) AND 
					(_r >= rCount - countVariance AND _r <= rCount + countVariance) AND 
					(_s >= sCount - countVariance AND _s <= sCount + countVariance) AND 
					(_t >= tCount - countVariance AND _t <= tCount + countVariance) AND 
					(_u >= uCount - countVariance AND _u <= uCount + countVariance) AND 
					(_v >= vCount - countVariance AND _v <= vCount + countVariance) AND 
					(_w >= wCount - countVariance AND _w <= wCount + countVariance) AND 
					(_x >= xCount - countVariance AND _x <= xCount + countVariance) AND 
					(_y >= yCount - countVariance AND _y <= yCount + countVariance) AND 
					(_z >= zCount - countVariance AND _z <= zCount + countVariance) AND 
					(_1 >= 1Count - countVariance AND _1 <= 1Count + countVariance) AND 
					(_2 >= 2Count - countVariance AND _2 <= 2Count + countVariance) AND 
					(_3 >= 3Count - countVariance AND _3 <= 3Count + countVariance) AND 
					(_4 >= 4Count - countVariance AND _4 <= 4Count + countVariance) AND 
					(_5 >= 5Count - countVariance AND _5 <= 5Count + countVariance) AND 
					(_6 >= 6Count - countVariance AND _6 <= 6Count + countVariance) AND 
					(_7 >= 7Count - countVariance AND _7 <= 7Count + countVariance) AND 
					(_8 >= 8Count - countVariance AND _8 <= 8Count + countVariance) AND 
					(_9 >= 9Count - countVariance AND _9 <= 9Count + countVariance) AND 
					(_0 >= 0Count - countVariance AND _0 <= 0Count + countVariance) AND 
					(_ >= spaceCount - countVariance AND _ <= spaceCount + countVariance)
				)
		) initialMatches
		
	) matchesWithConstraints
	
	JOIN v_taxon_name tn ON tn.id = taxon_name_id
	WHERE total_count_diff <= maxCountDiff
	
	ORDER BY is_exact_match DESC, first_character_match DESC, total_count_diff ASC, length_within_range DESC, length_diff ASC, tn.version_id DESC
	LIMIT maxResultCount;
	
END//
DELIMITER ;