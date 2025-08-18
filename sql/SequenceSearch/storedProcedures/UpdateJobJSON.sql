
DROP PROCEDURE IF EXISTS `updateJobJSON`;

DELIMITER //

CREATE PROCEDURE `updateJobJSON`(
	IN `jobID` INT,
   IN `jobUID` VARCHAR(100),
   IN `json_` LONGTEXT,
   IN `message_` VARCHAR(1000),
   IN `status_` VARCHAR(100)
)
BEGIN
	DECLARE fullStatus VARCHAR(100);
	DECLARE statusTID INT;
	
	SET jobUID = TRIM(jobUID);

   -- Validate the job UID / job ID
	IF jobUID IS NULL AND LENGTH(jobUID) < 1 AND jobID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A job ID or UID parameter must be provided';
	END IF;

   -- Validate the status parameter.
	IF status_ IS NULL OR LENGTH(status_) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status_ parameter';
	END IF;

	-- Prepend the vocabulary key "job_status".
	SET fullStatus := CONCAT('job_status.', status_);
	
	-- Lookup the term ID for the status.
	SET statusTID := (SELECT id FROM term WHERE full_key = fullStatus LIMIT 1);
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for the status parameter';
	END IF;


	-- Update the job record
	UPDATE job SET
		ended_on = NOW(),
      `json` = json_,
		`message` = message_,
		status_tid = statusTID
		
	WHERE (jobID IS NOT NULL AND id = jobID)
   OR (jobUID IS NOT NULL AND LENGTH(jobUID) > 0 AND `uid` = jobUID);

END //

DELIMITER ;