
DELIMITER //

CREATE OR REPLACE PROCEDURE searchTaxonHistogram(
	IN searchName VARCHAR(100)
)
BEGIN

   DECLARE nameLength INT;

   -- TESTING
   DECLARE diffThreshold INT;
   DECLARE maxDifferences INT;

	
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
	
	-- Get the length of the search name parameter.
	SET nameLength = LENGTH(searchName);
	
   -- Convert search name to lowercase.
	SET searchName = LOWER(searchName);
	
	SET diffThreshold = 1;
   SET maxDifferences = 10;
   
	
	-- Calculate a count for every symbol.
	SET aCount = nameLength - LENGTH(REPLACE(searchName, 'a', ''));
	SET bCount = nameLength - LENGTH(REPLACE(searchName, 'b', ''));
	SET cCount = nameLength - LENGTH(REPLACE(searchName, 'c', ''));
	SET dCount = nameLength - LENGTH(REPLACE(searchName, 'd', ''));
	SET eCount = nameLength - LENGTH(REPLACE(searchName, 'e', ''));
	SET fCount = nameLength - LENGTH(REPLACE(searchName, 'f', ''));
	SET gCount = nameLength - LENGTH(REPLACE(searchName, 'g', ''));
	SET hCount = nameLength - LENGTH(REPLACE(searchName, 'h', ''));
	SET iCount = nameLength - LENGTH(REPLACE(searchName, 'i', ''));
	SET jCount = nameLength - LENGTH(REPLACE(searchName, 'j', ''));
	SET kCount = nameLength - LENGTH(REPLACE(searchName, 'k', ''));
	SET lCount = nameLength - LENGTH(REPLACE(searchName, 'l', ''));
	SET mCount = nameLength - LENGTH(REPLACE(searchName, 'm', ''));
	SET nCount = nameLength - LENGTH(REPLACE(searchName, 'n', ''));
	SET oCount = nameLength - LENGTH(REPLACE(searchName, 'o', ''));
	SET pCount = nameLength - LENGTH(REPLACE(searchName, 'p', ''));
	SET qCount = nameLength - LENGTH(REPLACE(searchName, 'q', ''));
	SET rCount = nameLength - LENGTH(REPLACE(searchName, 'r', ''));
	SET sCount = nameLength - LENGTH(REPLACE(searchName, 's', ''));
	SET tCount = nameLength - LENGTH(REPLACE(searchName, 't', ''));
	SET uCount = nameLength - LENGTH(REPLACE(searchName, 'u', ''));
	SET vCount = nameLength - LENGTH(REPLACE(searchName, 'v', ''));
	SET wCount = nameLength - LENGTH(REPLACE(searchName, 'w', ''));
	SET xCount = nameLength - LENGTH(REPLACE(searchName, 'x', ''));
	SET yCount = nameLength - LENGTH(REPLACE(searchName, 'y', ''));
	SET zCount = nameLength - LENGTH(REPLACE(searchName, 'z', ''));
	SET 1Count = nameLength - LENGTH(REPLACE(searchName, '1', ''));
	SET 2Count = nameLength - LENGTH(REPLACE(searchName, '2', ''));
	SET 3Count = nameLength - LENGTH(REPLACE(searchName, '3', ''));
	SET 4Count = nameLength - LENGTH(REPLACE(searchName, '4', ''));
	SET 5Count = nameLength - LENGTH(REPLACE(searchName, '5', ''));
	SET 6Count = nameLength - LENGTH(REPLACE(searchName, '6', ''));
	SET 7Count = nameLength - LENGTH(REPLACE(searchName, '7', ''));
	SET 8Count = nameLength - LENGTH(REPLACE(searchName, '8', ''));
	SET 9Count = nameLength - LENGTH(REPLACE(searchName, '9', ''));
	SET 0Count = nameLength - LENGTH(REPLACE(searchName, '0', ''));
	SET spaceCount = nameLength - LENGTH(REPLACE(searchName, ' ', ''));


	SELECT *
	FROM (
		SELECT *, 
			(aDiff + bDiff + cDiff + dDiff + eDiff + fDiff + gDiff + hDiff + iDiff + jDiff + 
			kDiff + lDiff + mDiff + nDiff + oDiff + pDiff + qDiff + rDiff + sDiff + tDiff + 
			uDiff + vDiff + wDiff + xDiff + yDiff + zDiff + 1Diff + 2Diff + 3Diff + 4Diff + 
			5Diff + 6Diff + 7Diff + 8Diff + 9Diff + 0Diff + spaceDiff) AS totalDiff 
		FROM (
			SELECT 
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
				_, spaceCount, ABS(spaceCount - _) AS spaceDiff,
				taxon_name_id
			FROM taxon_histogram 
			WHERE 
			((_a = 0 AND aCount = 0) OR (_a >= aCount - diffThreshold AND _a <= aCount + 1)) AND 
			(_b >= bCount - diffThreshold AND _b <= bCount + 1) AND 
			(_c >= cCount - diffThreshold AND _c <= cCount + 1) AND 
			(_d >= dCount - diffThreshold AND _d <= dCount + 1) AND 
			(_e >= eCount - diffThreshold AND _e <= eCount + 1) AND 
			(_f >= fCount - diffThreshold AND _f <= fCount + 1) AND 
			(_g >= gCount - diffThreshold AND _g <= gCount + 1) AND 
			(_h >= hCount - diffThreshold AND _h <= hCount + 1) AND 
			(_i >= iCount - diffThreshold AND _i <= iCount + 1) AND 
			(_j >= jCount - diffThreshold AND _j <= jCount + 1) AND 
			(_k >= kCount - diffThreshold AND _k <= kCount + 1) AND 
			(_l >= lCount - diffThreshold AND _l <= lCount + 1) AND 
			(_m >= mCount - diffThreshold AND _m <= mCount + 1) AND 
			(_n >= nCount - diffThreshold AND _n <= nCount + 1) AND 
			(_o >= oCount - diffThreshold AND _o <= oCount + 1) AND 
			(_p >= pCount - diffThreshold AND _p <= pCount + 1) AND 
			(_q >= qCount - diffThreshold AND _q <= qCount + 1) AND 
			(_r >= rCount - diffThreshold AND _r <= rCount + 1) AND 
			(_s >= sCount - diffThreshold AND _s <= sCount + 1) AND 
			(_t >= tCount - diffThreshold AND _t <= tCount + 1) AND 
			(_u >= uCount - diffThreshold AND _u <= uCount + 1) AND 
			(_v >= vCount - diffThreshold AND _v <= vCount + 1) AND 
			(_w >= wCount - diffThreshold AND _w <= wCount + 1) AND 
			(_x >= xCount - diffThreshold AND _x <= xCount + 1) AND 
			(_y >= yCount - diffThreshold AND _y <= yCount + 1) AND 
			(_z >= zCount - diffThreshold AND _z <= zCount + 1) AND 
			(_1 >= 1Count - diffThreshold AND _1 <= 1Count + 1) AND 
			(_2 >= 2Count - diffThreshold AND _2 <= 2Count + 1) AND 
			(_3 >= 3Count - diffThreshold AND _3 <= 3Count + 1) AND 
			(_4 >= 4Count - diffThreshold AND _4 <= 4Count + 1) AND 
			(_5 >= 5Count - diffThreshold AND _5 <= 5Count + 1) AND 
			(_6 >= 6Count - diffThreshold AND _6 <= 6Count + 1) AND 
			(_7 >= 7Count - diffThreshold AND _7 <= 7Count + 1) AND 
			(_8 >= 8Count - diffThreshold AND _8 <= 8Count + 1) AND 
			(_9 >= 9Count - diffThreshold AND _9 <= 9Count + 1) AND 
			(_0 >= 0Count - diffThreshold AND _0 <= 0Count + 1) AND 
			(_ >= spaceCount - diffThreshold AND _ <= spaceCount + 1)
		) results1
	) results2
	JOIN taxon_name tn ON tn.id = taxon_name_id
	WHERE totalDiff <= maxDifferences
	ORDER BY totalDiff DESC;
	
END;

//

DELIMITER ;
