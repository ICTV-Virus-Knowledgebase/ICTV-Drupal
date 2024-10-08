
-- Create a taxon_histogram record for every taxon_name.

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
		WHERE tn.id NOT IN (
			SELECT taxon_name_id FROM taxon_histogram
		);
	
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