DELIMITER //

DROP PROCEDURE IF EXISTS `addNameToTaxonHistogram`;

CREATE PROCEDURE `addNameToTaxonHistogram`(
	IN `taxonName` VARCHAR(500),
	IN `taxonNameID` INT
)
BEGIN

	DECLARE firstCharacter VARCHAR(1);
	DECLARE nameLength INT;
	
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
	SET nameLength = LENGTH(taxonName);
	
   -- Convert taxon name to lowercase.
	SET taxonName = LOWER(taxonName);
	
	
	-- Calculate a count for every symbol.
	SET aCount = nameLength - LENGTH(REPLACE(taxonName, 'a', ''));
	SET bCount = nameLength - LENGTH(REPLACE(taxonName, 'b', ''));
	SET cCount = nameLength - LENGTH(REPLACE(taxonName, 'c', ''));
	SET dCount = nameLength - LENGTH(REPLACE(taxonName, 'd', ''));
	SET eCount = nameLength - LENGTH(REPLACE(taxonName, 'e', ''));
	SET fCount = nameLength - LENGTH(REPLACE(taxonName, 'f', ''));
	SET gCount = nameLength - LENGTH(REPLACE(taxonName, 'g', ''));
	SET hCount = nameLength - LENGTH(REPLACE(taxonName, 'h', ''));
	SET iCount = nameLength - LENGTH(REPLACE(taxonName, 'i', ''));
	SET jCount = nameLength - LENGTH(REPLACE(taxonName, 'j', ''));
	SET kCount = nameLength - LENGTH(REPLACE(taxonName, 'k', ''));
	SET lCount = nameLength - LENGTH(REPLACE(taxonName, 'l', ''));
	SET mCount = nameLength - LENGTH(REPLACE(taxonName, 'm', ''));
	SET nCount = nameLength - LENGTH(REPLACE(taxonName, 'n', ''));
	SET oCount = nameLength - LENGTH(REPLACE(taxonName, 'o', ''));
	SET pCount = nameLength - LENGTH(REPLACE(taxonName, 'p', ''));
	SET qCount = nameLength - LENGTH(REPLACE(taxonName, 'q', ''));
	SET rCount = nameLength - LENGTH(REPLACE(taxonName, 'r', ''));
	SET sCount = nameLength - LENGTH(REPLACE(taxonName, 's', ''));
	SET tCount = nameLength - LENGTH(REPLACE(taxonName, 't', ''));
	SET uCount = nameLength - LENGTH(REPLACE(taxonName, 'u', ''));
	SET vCount = nameLength - LENGTH(REPLACE(taxonName, 'v', ''));
	SET wCount = nameLength - LENGTH(REPLACE(taxonName, 'w', ''));
	SET xCount = nameLength - LENGTH(REPLACE(taxonName, 'x', ''));
	SET yCount = nameLength - LENGTH(REPLACE(taxonName, 'y', ''));
	SET zCount = nameLength - LENGTH(REPLACE(taxonName, 'z', ''));
	SET 1Count = nameLength - LENGTH(REPLACE(taxonName, '1', ''));
	SET 2Count = nameLength - LENGTH(REPLACE(taxonName, '2', ''));
	SET 3Count = nameLength - LENGTH(REPLACE(taxonName, '3', ''));
	SET 4Count = nameLength - LENGTH(REPLACE(taxonName, '4', ''));
	SET 5Count = nameLength - LENGTH(REPLACE(taxonName, '5', ''));
	SET 6Count = nameLength - LENGTH(REPLACE(taxonName, '6', ''));
	SET 7Count = nameLength - LENGTH(REPLACE(taxonName, '7', ''));
	SET 8Count = nameLength - LENGTH(REPLACE(taxonName, '8', ''));
	SET 9Count = nameLength - LENGTH(REPLACE(taxonName, '9', ''));
	SET 0Count = nameLength - LENGTH(REPLACE(taxonName, '0', ''));
	SET spaceCount = nameLength - LENGTH(REPLACE(taxonName, ' ', ''));
	
   
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

      `filtered_text`,
		`first_character`,
		taxon_name_id,
      `text_length`
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

      taxonName,
		firstCharacter,
		taxonNameID,
      nameLength 
	); 
	
END//
DELIMITER ;