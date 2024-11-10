-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.1.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.3.0.6589
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for procedure virus_name_lookup.createTaxonHistogram
DELIMITER //
CREATE PROCEDURE `createTaxonHistogram`(
	IN `taxonName` VARCHAR(500),
	IN `taxonNameID` INT
)
BEGIN

	DECLARE firstCharacter VARCHAR(1);
	DECLARE textLength INT;
	
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
	
	-- Get the first character.
   SET firstCharacter = LEFT(taxonName, 1);
   
	-- Get the length of the taxon name parameter.
	SET textLength = LENGTH(taxonName);
	
   -- Convert taxon name to lowercase.
	SET taxonName = LOWER(taxonName);
	
	
	-- Calculate a count for every symbol.
	SET aCount = textLength - LENGTH(REPLACE(taxonName, 'a', ''));
	SET bCount = textLength - LENGTH(REPLACE(taxonName, 'b', ''));
	SET cCount = textLength - LENGTH(REPLACE(taxonName, 'c', ''));
	SET dCount = textLength - LENGTH(REPLACE(taxonName, 'd', ''));
	SET eCount = textLength - LENGTH(REPLACE(taxonName, 'e', ''));
	SET fCount = textLength - LENGTH(REPLACE(taxonName, 'f', ''));
	SET gCount = textLength - LENGTH(REPLACE(taxonName, 'g', ''));
	SET hCount = textLength - LENGTH(REPLACE(taxonName, 'h', ''));
	SET iCount = textLength - LENGTH(REPLACE(taxonName, 'i', ''));
	SET jCount = textLength - LENGTH(REPLACE(taxonName, 'j', ''));
	SET kCount = textLength - LENGTH(REPLACE(taxonName, 'k', ''));
	SET lCount = textLength - LENGTH(REPLACE(taxonName, 'l', ''));
	SET mCount = textLength - LENGTH(REPLACE(taxonName, 'm', ''));
	SET nCount = textLength - LENGTH(REPLACE(taxonName, 'n', ''));
	SET oCount = textLength - LENGTH(REPLACE(taxonName, 'o', ''));
	SET pCount = textLength - LENGTH(REPLACE(taxonName, 'p', ''));
	SET qCount = textLength - LENGTH(REPLACE(taxonName, 'q', ''));
	SET rCount = textLength - LENGTH(REPLACE(taxonName, 'r', ''));
	SET sCount = textLength - LENGTH(REPLACE(taxonName, 's', ''));
	SET tCount = textLength - LENGTH(REPLACE(taxonName, 't', ''));
	SET uCount = textLength - LENGTH(REPLACE(taxonName, 'u', ''));
	SET vCount = textLength - LENGTH(REPLACE(taxonName, 'v', ''));
	SET wCount = textLength - LENGTH(REPLACE(taxonName, 'w', ''));
	SET xCount = textLength - LENGTH(REPLACE(taxonName, 'x', ''));
	SET yCount = textLength - LENGTH(REPLACE(taxonName, 'y', ''));
	SET zCount = textLength - LENGTH(REPLACE(taxonName, 'z', ''));
	SET 1Count = textLength - LENGTH(REPLACE(taxonName, '1', ''));
	SET 2Count = textLength - LENGTH(REPLACE(taxonName, '2', ''));
	SET 3Count = textLength - LENGTH(REPLACE(taxonName, '3', ''));
	SET 4Count = textLength - LENGTH(REPLACE(taxonName, '4', ''));
	SET 5Count = textLength - LENGTH(REPLACE(taxonName, '5', ''));
	SET 6Count = textLength - LENGTH(REPLACE(taxonName, '6', ''));
	SET 7Count = textLength - LENGTH(REPLACE(taxonName, '7', ''));
	SET 8Count = textLength - LENGTH(REPLACE(taxonName, '8', ''));
	SET 9Count = textLength - LENGTH(REPLACE(taxonName, '9', ''));
	SET 0Count = textLength - LENGTH(REPLACE(taxonName, '0', ''));
	SET spaceCount = textLength - LENGTH(REPLACE(taxonName, ' ', ''));
	
   
   INSERT INTO `taxon_histogram` (
		_a, 
		_b, 
		_c, 
		_d, 
		_e, 
		_f, 
		_g, 
		_h, 
		_i, 
		_j, 
		_k, 
		_l, 
		_m, 
		_n, 
		_o, 
		_p, 
		_q, 
		_r, 
		_s, 
		_t, 
		_u, 
		_v, 
		_w, 
		_x, 
		_y, 
		_z, 
		_1, 
		_2, 
		_3, 
		_4, 
		_5, 
		_6, 
		_7, 
		_8, 
		_9, 
		_0, 
		_,
		`first_character`,
		`text_length`,
		taxon_name_id
	) VALUES (
		aCount, 
		bCount, 
		cCount, 
		dCount, 
		eCount, 
		fCount, 
		gCount, 
		hCount, 
		iCount, 
		jCount, 
		kCount, 
		lCount, 
		mCount, 
		nCount, 
		oCount, 
		pCount, 
		qCount, 
		rCount, 
		sCount, 
		tCount, 
		uCount, 
		vCount, 
		wCount, 
		xCount, 
		yCount, 
		zCount, 
		1Count, 
		2Count, 
		3Count, 
		4Count, 
		5Count, 
		6Count, 
		7Count, 
		8Count, 
		9Count, 
		0Count, 
		spaceCount,
		firstCharacter,
		textLength,
		taxonNameID 
	); 
	
END//
DELIMITER ;


-- Dumping structure for function virus_name_lookup.getFilteredName
DELIMITER //
CREATE FUNCTION `getFilteredName`(`name` NVARCHAR(300)
) RETURNS varchar(300) CHARSET utf8mb3 COLLATE utf8mb3_general_ci
BEGIN

	DECLARE filteredName NVARCHAR(300);
	
	
	SET filteredName = 
	REPLACE(
		REPLACE(
			REPLACE(
				REPLACE(
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(
											REPLACE(
												REPLACE(
													REPLACE(
														REPLACE(
															REPLACE(NAME, '-', ' ')
														, '_', ' ')
													, '`', '')
												, '"', '')
											, '''', '')
										, '!', '')
									, '?', '')
								, '  ', ' ')
							, '(', ',')
						, ')', ',')
					, ';', ',')
				, ':', ',')
			, ',,', ',')
		, '/', ' ')
	, '\\', ' ');
	
	RETURN filteredName;
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.importTaxonName
DELIMITER //
CREATE PROCEDURE `importTaxonName`(
	IN `name` NVARCHAR(300),
	IN `nameClass` VARCHAR(100),
	IN `parentTaxonomyDB` VARCHAR(100),
	IN `parentTaxonomyID` INT,
	IN `rankName` VARCHAR(50),
	IN `taxonomyDB` VARCHAR(50),
	IN `taxonomyID` INT,
	IN `versionID` INT
)
    MODIFIES SQL DATA
BEGIN

	-- Declare variables used below.
	DECLARE filteredName NVARCHAR(300);
	DECLARE nameClassTID INT;
	DECLARE parentTaxonomyDbTID INT;
	DECLARE rankNameTID INT;
	DECLARE taxonomyDbTID INT;
	DECLARE virusDivisionTID INT;
	

	-- Validate the input variables
	SET name = TRIM(name);
   IF name IS NULL OR LENGTH(name) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;
   
   SET nameClass = TRIM(nameClass);
   IF nameClass IS NULL OR LENGTH(nameClass) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class parameter';
   END IF;
	
	SET parentTaxonomyDB = TRIM(parentTaxonomyDB);
	
	SET rankName = TRIM(rankName);
	IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid rank name parameter';
   END IF;
	
	SET taxonomyDB = TRIM(taxonomyDB);
	IF taxonomyDB IS NULL OR LENGTH(taxonomyDB) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy DB parameter';
   END IF;
   
   IF taxonomyID IS NULL OR taxonomyID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy ID parameter';
   END IF;
	
	
	-- Lookup term IDs
	SET nameClassTID = (SELECT id FROM term WHERE full_key = CONCAT('name_class.', nameClass) LIMIT 1);
	SET rankNameTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_rank.', rankName) LIMIT 1);
	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_db.', taxonomyDB) LIMIT 1);
	SET virusDivisionTID = (SELECT id FROM term WHERE full_key = 'ncbi_division.viruses' LIMIT 1);
	
	IF parentTaxonomyDB IS NOT NULL AND LENGTH(parentTaxonomyDB) > 0 THEN
		BEGIN 
			-- Lookup the term ID for parent taxonomy DB and validate it.
			SET parentTaxonomyDbTID = (SELECT id FROM term WHERE full_key = CONCAT('taxonomy_db.', parentTaxonomyDB) LIMIT 1);
			IF parentTaxonomyDbTID IS NULL THEN 
				SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for parent taxonomy DB parameter';
		   END IF;
		   
		   -- Validate the parent taxonomy ID.
		   IF parentTaxonomyID IS NULL THEN 
				SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid parent taxonomy ID parameter';
		   END IF;
		END;
	ELSE
		BEGIN 
			SET parentTaxonomyDbTID = NULL;
			SET parentTaxonomyID = NULL;
		END;
	END IF;
	
	
	-- Filter the name
	SET filteredName = getFilteredName(name);
	
	
	-- Create the new taxon_name record.
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		`name`,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	) VALUES (
		virusDivisionTID,
		filteredName,
		name,
		nameClassTID,
		parentTaxonomyDbTID,
		parentTaxonomyID,
		rankName,
		rankNameTID,
		taxonomyDbTID,
		taxonomyID,
		versionID
	);

	SELECT LAST_INSERT_ID();
	
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.populateTaxonHistogram
DELIMITER //
CREATE PROCEDURE `populateTaxonHistogram`()
    MODIFIES SQL DATA
BEGIN

	DECLARE done INT DEFAULT FALSE;
	DECLARE id INT;
	DECLARE filteredName NVARCHAR(500);
	
	DECLARE taxonCursor CURSOR FOR 
		SELECT 
			tn.id, 
			tn.filtered_name
		FROM taxon_name tn
		LIMIT 100;
		/*WHERE tn.id NOT IN (
			SELECT taxon_name_id FROM taxon_histogram
		);*/
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	
	OPEN taxonCursor;
	
	read_loop: LOOP
	
		FETCH taxonCursor INTO id, filteredName;
		
		CALL createTaxonHistogram(filteredName, id);
	
		IF done THEN
			LEAVE read_loop;
		END IF;
		
	END LOOP;
	
	CLOSE taxonCursor;
  
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.populateTaxonNameFromNCBI
DELIMITER //
CREATE PROCEDURE `populateTaxonNameFromNCBI`()
BEGIN
  
  
	-- TODO: What should we do if taxon_name already has NCBI Taxonomy records?
	
	DECLARE taxonomyDbTID INT DEFAULT NULL;
	
	-- ====================================================================================================
	-- Lookup the term ID for the NCBI taxonomy DB.
	-- ====================================================================================================
	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
	IF taxonomyDbTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid term ID for taxonomy_db.ncbi_taxonomy';
	END IF;
	
	
	-- ====================================================================================================
	-- Create taxon_name records from (a subset of) NCBI Taxonomy.
	-- ====================================================================================================
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		is_valid,
		name,
		name_class_tid,
		parent_taxonomy_id,
		rank_name,
		rank_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	)
	
	SELECT 
		d.tid AS division_tid,
		
		-- TODO: What's a good way to replace this with getFilteredName()?
		LOWER(
			REPLACE( 
				REPLACE( 
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(nname.name_txt, '-', ' ')
									, '_',' ')
								, '"', '')
							, '?', '')
						, '`', '')
					, '''', '')
				, '!', '')
			, '.', '')
		) AS filtered_name,
		1 AS is_valid,
		nname.name_txt AS name,
		nname.name_class_tid,
		nnode.parent_tax_id AS parent_taxonomy_id,
		nnode.rank_name,
		nnode.rank_name_tid,
		taxonomyDbTID AS taxonomy_db_tid,
		nnode.tax_id AS taxonomy_id,
		0 AS version_id
		
	FROM ncbi_node nnode
	JOIN ncbi_division d ON d.id = nnode.division_id
	JOIN ncbi_name nname ON nname.tax_id = nnode.tax_id
	WHERE nname.name_class_tid IS NOT NULL 
	AND d.tid IN (
		SELECT divTerm.id
		FROM term divTerm
		WHERE divTerm.full_key IN (
			'ncbi_division.bacteria',
			'ncbi_division.environmental_samples',
			'ncbi_division.phages',
			'ncbi_division.synthetic_and_chimeric',
			'ncbi_division.unassigned',
			'ncbi_division.viruses'
		)
	);
	
END//
DELIMITER ;

-- Dumping structure for procedure virus_name_lookup.searchTaxonHistogram
DELIMITER //
CREATE PROCEDURE `searchTaxonHistogram`(
	IN `countThreshold` INT,
	IN `lengthThreshold` INT,
	IN `maxCountDiffs` INT,
	IN `maxLengthDiff` INT,
	IN `maxResultCount` INT,
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
	
	IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid search text parameter (empty)';
   END IF;
	
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
			5Diff + 6Diff + 7Diff + 8Diff + 9Diff + 0Diff + spaceDiff) AS totalCountDiff,
			CASE
				WHEN length_diff >= searchLength - lengthThreshold AND length_diff <= searchLength + lengthThreshold THEN 1 ELSE 0
			END AS length_within_range
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
	
	ORDER BY tn.version_id DESC, first_character_match DESC, totalCountDiff ASC, length_within_range DESC, length_diff ASC
	LIMIT maxResultCount;
	
END//
DELIMITER ;