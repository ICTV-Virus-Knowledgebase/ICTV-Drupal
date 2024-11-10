
DELIMITER //

DROP PROCEDURE IF EXISTS `calculateAllUniquenessScores`;

CREATE PROCEDURE `calculateAllUniquenessScores`(
	
   -- The percentage of the name's length to use when calculating differences.
	IN `percentOfLength` INT

)
BEGIN

   DECLARE done BOOLEAN DEFAULT FALSE;
   DECLARE taxonNameID BIGINT UNSIGNED;
   DECLARE taxaCursor CURSOR FOR 
      SELECT taxon_name_id 
      FROM taxon_name
      WHERE taxon_name_id IN ()


   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done := TRUE;

   OPEN taxaCursor;

   taxonNameLoop: LOOP
      FETCH taxaCursor INTO taxonNameID;
      IF done THEN
         LEAVE taxonNameLoop;
      END IF;

      -- Calculate the uniqueness scores for the taxon name with this ID.
      CALL calculateUniquenessScores(percentOfLength, taxonNameID);

   END LOOP taxonNameLoop;

  CLOSE taxaCursor;

END//
DELIMITER ;