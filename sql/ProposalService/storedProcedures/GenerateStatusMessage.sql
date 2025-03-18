
DROP FUNCTION IF EXISTS `generateStatusMessage`;

DELIMITER //

CREATE FUNCTION `generateStatusMessage` (
    `errorCount` INT,
    `infoCount` INT,
    `successCount` INT,
    `warningCount` INT
)
RETURNS VARCHAR(300)
BEGIN

   DECLARE message VARCHAR(300);
    
	SET message := '';

   -- Generate error text
   IF errorCount = 1 THEN
      SET message := CONCAT(message, "1 error");
   ELSEIF errorCount > 1 THEN
      SET message := CONCAT(message, CAST(errorCount AS VARCHAR(100)), ' errors');
   END IF;
   
   -- Generate success text
   IF successCount = 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, '1 success');
   ELSEIF successCount > 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, CAST(successCount AS VARCHAR(100)), ' successes');
   END IF;

   -- Generate warning text
   IF warningCount = 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, '1 warning');
   ELSEIF warningCount > 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, CAST(warningCount AS VARCHAR(100)), ' warnings');
   END IF;

   -- Generate notes text
   IF infoCount = 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, '1 note');
   ELSEIF infoCount > 1 THEN
      IF LENGTH(message) > 0 THEN SET message := CONCAT(message, ', '); END IF;
      SET message := CONCAT(message, CAST(infoCount AS VARCHAR(100)), ' notes');
   END IF;

   RETURN message;

END //

DELIMITER ;
