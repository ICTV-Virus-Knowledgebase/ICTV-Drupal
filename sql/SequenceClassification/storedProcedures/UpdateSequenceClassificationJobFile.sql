
DROP PROCEDURE IF EXISTS `updateSequenceClassificationJobFile`;

DELIMITER //

CREATE PROCEDURE `updateSequenceClassificationJobFile`(
	IN `filename_` VARCHAR(300),
	IN `jobID` INT,
   IN `json` TEXT,
   IN `message_` VARCHAR(1000),
   IN `status_` VARCHAR(100)
)
BEGIN
	DECLARE fullStatus VARCHAR(100);
	DECLARE statusTID INT;
	
	-- Validate the job_file's filename
	/*IF filename_ IS NULL OR LENGTH(filename_) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid filename_ parameter';
	END IF;*/
	
   -- Validate the status parameter.
	IF status_ IS NULL OR LENGTH(status_) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status_ parameter';
	END IF;

	-- Validate the job ID
	IF jobID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job ID parameter';
	END IF;

	-- Prepend the vocabulary key "job_status".
	SET fullStatus := CONCAT('job_status.', _status);
	
	-- Lookup the term ID for the status.
	SET statusTID := (
		SELECT id 
		FROM term 
		WHERE full_key = fullStatus
		LIMIT 1
	);
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for the status parameter';
	END IF;

	-- Update the job_file
	UPDATE job_file SET
		ended_on = NOW(),
		`filename` = filename_,
      `json` = json_,
		`message` = message_,
		status_tid = statusTID
		
	WHERE job_id = jobID
	AND job_file.filename = filename_;

END //

DELIMITER ;