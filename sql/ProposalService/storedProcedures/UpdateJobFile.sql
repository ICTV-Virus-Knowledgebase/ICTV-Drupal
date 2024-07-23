
DELIMITER //

DROP PROCEDURE IF EXISTS `updateJobFile`;

CREATE PROCEDURE `updateJobFile`(
	IN `errorCount` INT,
	IN `filename_` VARCHAR(300),
	IN `infoCount` INT,
	IN `jobUID` VARCHAR(100),
	IN `successCount` INT,
	IN `warningCount` INT
)
BEGIN
	DECLARE fullStatus VARCHAR(100);
	DECLARE jobID INT;
	DECLARE _message VARCHAR(300);
	DECLARE _status VARCHAR(100);
	DECLARE statusTID INT;
	
	-- Validate the job_file's filename
	IF filename_ IS NULL OR LENGTH(filename_) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid filename_ parameter';
	END IF;
	
	-- Validate the job UID
	IF jobUID IS NULL OR LENGTH(jobUID) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job UID parameter';
	END IF;

	-- Lookup the job ID
	SET jobID := (SELECT id FROM job WHERE uid = jobUID LIMIT 1);
	IF jobID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job ID parameter';
	END IF;

	-- Determine the status using the error and warning counts.
	IF errorCount > 0 OR warningCount > 0 THEN
		SET _status := 'invalid';
	ELSE
		SET _status := 'valid';
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

	-- Use the counts to generate the job_file's message.
	SET _message := (SELECT generateStatusMessage(errorCount, infoCount, successCount, warningCount));

	-- Update the job_file
	UPDATE job_file SET
		ended_on = NOW(),
		error_count = errorCount,
		info_count = infoCount,
		job_file.message = _message,
		status_tid = statusTID,
		success_count = successCount,
		warning_count = warningCount
		
	WHERE job_id = jobID
	AND job_file.filename = filename_;

END //

DELIMITER ;