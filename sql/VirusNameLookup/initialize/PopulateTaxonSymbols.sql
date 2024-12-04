
DROP PROCEDURE IF EXISTS `PopulateTaxonSymbols`;


DELIMITER //

CREATE PROCEDURE PopulateTaxonSymbols()
BEGIN

   DECLARE done INT DEFAULT FALSE;
   DECLARE filteredName VARCHAR(300);
   DECLARE nameIndex INT;
   DECLARE nameLength INT;
   DECLARE stID INT(11) UNSIGNED;
   DECLARE symbolA CHAR(1);
   DECLARE symbolB CHAR(1);
   

   -- A cursor to fetch searchable_taxon records.
   DECLARE cur CURSOR FOR 

      SELECT id, filtered_name
      FROM searchable_taxon;
      
   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN cur;   
      
   -- Delete any existing records.
   DELETE FROM taxon_symbols;

   -- Iterate over all records in searchable_taxon.
   read_loop: LOOP

      FETCH cur INTO stID, filteredName;

      IF stID IS NULL THEN
         LEAVE read_loop;
      END IF;

      IF done THEN
         LEAVE read_loop;
      END IF;

      SET filteredName = CONCAT(' ', TRIM(filteredName), ' ');

      SET nameLength = LENGTH(filteredName);

		-- The loop will start with the 2nd name index.
		SET nameIndex = 2;

      -- Get the first symbol.
		SET symbolA = SUBSTRING(filteredName, 1, 1);

      WHILE nameIndex <= nameLength DO
		
			-- Get the second symbol in the relation.
			SET symbolB = SUBSTRING(filteredName, nameIndex, 1);

			INSERT INTO taxon_symbols (
				a, 
				b,
            searchable_taxon_id
			) VALUES (
            symbolA,
				symbolB,
            stID
			);

			-- Increment the name index.
			SET nameIndex = nameIndex + 1;

			-- The second symbol will be the first symbol in the next iteration.
			SET symbolA = symbolB;

		END WHILE;

   END LOOP;

   CLOSE cur;
END //

DELIMITER ;

