DELIMITER //
CREATE PROCEDURE `searchTaxonHistogram`(
	IN `countThreshold` INT,
	IN `maxCountDiffs` INT,
	IN `maxLengthDiff` INT,
	IN `searchText` NVARCHAR(500)
)
BEGIN

	DECLARE firstCharacter VARCHAR(1);
   DECLARE searchLength INT;

	-- Variables to store character counts.
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
	
	-- Get the first character of the search text.
	SET firstCharacter = LEFT(searchText, 1);
	
	-- Get the length of the search text.
	SET searchLength = LENGTH(searchText);
	
	
	-- Calculate a count for every symbol.
	SET aCount = searchLength - LENGTH(REPLACE(searchText, 'a', ''));
	SET bCount = searchLength - LENGTH(REPLACE(searchText, 'b', ''));
	SET cCount = searchLength - LENGTH(REPLACE(searchText, 'c', ''));
	SET dCount = searchLength - LENGTH(REPLACE(searchText, 'd', ''));
	SET eCount = searchLength - LENGTH(REPLACE(searchText, 'e', ''));
	SET fCount = searchLength - LENGTH(REPLACE(searchText, 'f', ''));
	SET gCount = searchLength - LENGTH(REPLACE(searchText, 'g', ''));
	SET hCount = searchLength - LENGTH(REPLACE(searchText, 'h', ''));
	SET iCount = searchLength - LENGTH(REPLACE(searchText, 'i', ''));
	SET jCount = searchLength - LENGTH(REPLACE(searchText, 'j', ''));
	SET kCount = searchLength - LENGTH(REPLACE(searchText, 'k', ''));
	SET lCount = searchLength - LENGTH(REPLACE(searchText, 'l', ''));
	SET mCount = searchLength - LENGTH(REPLACE(searchText, 'm', ''));
	SET nCount = searchLength - LENGTH(REPLACE(searchText, 'n', ''));
	SET oCount = searchLength - LENGTH(REPLACE(searchText, 'o', ''));
	SET pCount = searchLength - LENGTH(REPLACE(searchText, 'p', ''));
	SET qCount = searchLength - LENGTH(REPLACE(searchText, 'q', ''));
	SET rCount = searchLength - LENGTH(REPLACE(searchText, 'r', ''));
	SET sCount = searchLength - LENGTH(REPLACE(searchText, 's', ''));
	SET tCount = searchLength - LENGTH(REPLACE(searchText, 't', ''));
	SET uCount = searchLength - LENGTH(REPLACE(searchText, 'u', ''));
	SET vCount = searchLength - LENGTH(REPLACE(searchText, 'v', ''));
	SET wCount = searchLength - LENGTH(REPLACE(searchText, 'w', ''));
	SET xCount = searchLength - LENGTH(REPLACE(searchText, 'x', ''));
	SET yCount = searchLength - LENGTH(REPLACE(searchText, 'y', ''));
	SET zCount = searchLength - LENGTH(REPLACE(searchText, 'z', ''));
	SET 1Count = searchLength - LENGTH(REPLACE(searchText, '1', ''));
	SET 2Count = searchLength - LENGTH(REPLACE(searchText, '2', ''));
	SET 3Count = searchLength - LENGTH(REPLACE(searchText, '3', ''));
	SET 4Count = searchLength - LENGTH(REPLACE(searchText, '4', ''));
	SET 5Count = searchLength - LENGTH(REPLACE(searchText, '5', ''));
	SET 6Count = searchLength - LENGTH(REPLACE(searchText, '6', ''));
	SET 7Count = searchLength - LENGTH(REPLACE(searchText, '7', ''));
	SET 8Count = searchLength - LENGTH(REPLACE(searchText, '8', ''));
	SET 9Count = searchLength - LENGTH(REPLACE(searchText, '9', ''));
	SET 0Count = searchLength - LENGTH(REPLACE(searchText, '0', ''));
	SET spaceCount = searchLength - LENGTH(REPLACE(searchText, ' ', ''));


	SELECT *
	FROM (
		SELECT *, 
			(aDiff + bDiff + cDiff + dDiff + eDiff + fDiff + gDiff + hDiff + iDiff + jDiff + 
			kDiff + lDiff + mDiff + nDiff + oDiff + pDiff + qDiff + rDiff + sDiff + tDiff + 
			uDiff + vDiff + wDiff + xDiff + yDiff + zDiff + 1Diff + 2Diff + 3Diff + 4Diff + 
			5Diff + 6Diff + 7Diff + 8Diff + 9Diff + 0Diff + spaceDiff) AS totalCountDiff 
		FROM (
			
			SELECT
			
				-- The test record's taxon name ID.
				taxon_name_id,
				
				-- Does the first character of the search text match the first character in the test row?
				CASE
					WHEN first_character = firstCharacter THEN 1 ELSE 0
				END AS first_character_match,
				
				-- The difference in length between the search text and test record.
				ABS(searchLength - text_length) AS length_diff,
				
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
				_, spaceCount, ABS(spaceCount - _) AS spaceDiff
				
			FROM taxon_histogram
			
			-- Constrain by the difference in text lengths.
			WHERE (ABS(searchLength - text_length) <= maxLengthDiff) AND
			(_a >= aCount - countThreshold AND _a <= aCount + countThreshold) AND 
			(_b >= bCount - countThreshold AND _b <= bCount + countThreshold) AND 
			(_c >= cCount - countThreshold AND _c <= cCount + countThreshold) AND 
			(_d >= dCount - countThreshold AND _d <= dCount + countThreshold) AND 
			(_e >= eCount - countThreshold AND _e <= eCount + countThreshold) AND 
			(_f >= fCount - countThreshold AND _f <= fCount + countThreshold) AND 
			(_g >= gCount - countThreshold AND _g <= gCount + countThreshold) AND 
			(_h >= hCount - countThreshold AND _h <= hCount + countThreshold) AND 
			(_i >= iCount - countThreshold AND _i <= iCount + countThreshold) AND 
			(_j >= jCount - countThreshold AND _j <= jCount + countThreshold) AND 
			(_k >= kCount - countThreshold AND _k <= kCount + countThreshold) AND 
			(_l >= lCount - countThreshold AND _l <= lCount + countThreshold) AND 
			(_m >= mCount - countThreshold AND _m <= mCount + countThreshold) AND 
			(_n >= nCount - countThreshold AND _n <= nCount + countThreshold) AND 
			(_o >= oCount - countThreshold AND _o <= oCount + countThreshold) AND 
			(_p >= pCount - countThreshold AND _p <= pCount + countThreshold) AND 
			(_q >= qCount - countThreshold AND _q <= qCount + countThreshold) AND 
			(_r >= rCount - countThreshold AND _r <= rCount + countThreshold) AND 
			(_s >= sCount - countThreshold AND _s <= sCount + countThreshold) AND 
			(_t >= tCount - countThreshold AND _t <= tCount + countThreshold) AND 
			(_u >= uCount - countThreshold AND _u <= uCount + countThreshold) AND 
			(_v >= vCount - countThreshold AND _v <= vCount + countThreshold) AND 
			(_w >= wCount - countThreshold AND _w <= wCount + countThreshold) AND 
			(_x >= xCount - countThreshold AND _x <= xCount + countThreshold) AND 
			(_y >= yCount - countThreshold AND _y <= yCount + countThreshold) AND 
			(_z >= zCount - countThreshold AND _z <= zCount + countThreshold) AND 
			(_1 >= 1Count - countThreshold AND _1 <= 1Count + countThreshold) AND 
			(_2 >= 2Count - countThreshold AND _2 <= 2Count + countThreshold) AND 
			(_3 >= 3Count - countThreshold AND _3 <= 3Count + countThreshold) AND 
			(_4 >= 4Count - countThreshold AND _4 <= 4Count + countThreshold) AND 
			(_5 >= 5Count - countThreshold AND _5 <= 5Count + countThreshold) AND 
			(_6 >= 6Count - countThreshold AND _6 <= 6Count + countThreshold) AND 
			(_7 >= 7Count - countThreshold AND _7 <= 7Count + countThreshold) AND 
			(_8 >= 8Count - countThreshold AND _8 <= 8Count + countThreshold) AND 
			(_9 >= 9Count - countThreshold AND _9 <= 9Count + countThreshold) AND 
			(_0 >= 0Count - countThreshold AND _0 <= 0Count + countThreshold) AND 
			(_ >= spaceCount - countThreshold AND _ <= spaceCount + countThreshold)
		) results1
	) results2
	JOIN taxon_name tn ON tn.id = taxon_name_id
	WHERE totalCountDiff <= maxCountDiffs
	
	ORDER BY first_character_match DESC, totalCountDiff ASC, length_diff ASC;
	
END//
DELIMITER ;