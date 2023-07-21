
DELIMITER //

DROP PROCEDURE IF EXISTS `updateJobFile`;

CREATE PROCEDURE `updateJobFile`(
	IN `errorCount` INT,
	IN `infoCount` INT,
	IN `jobFileMessage` VARCHAR(100),
	IN `jobFilename` VARCHAR(100),
	IN `jobID` INT,
	IN `status` VARCHAR(50),
	IN `successCount` INT,
	IN `warningCount` INT
)
BEGIN
	DECLARE completedOn DATETIME;
	DECLARE failedOn DATETIME;
	DECLARE fullStatus VARCHAR(100);
	DECLARE statusTID INT;
	
	-- Validate the job filename
	IF jobFilename IS NULL OR jobFilename = '' THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid jobFilename parameter';
	END IF;
	
	-- Validate the status
	IF status IS NULL OR status = '' THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status parameter';
	END IF;

	SET fullStatus = CONCAT('job_status.', status);
	
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

	-- The status determines the completed_on and failed_on dates.
	IF STATUS = 'valid' THEN
		SET completedOn = NOW();
		SET failedOn = NULL;
	ELSEIF status = 'invalid' OR status = 'crashed' THEN
		SET completedOn = NULL;
		SET failedOn = NOW();
	ELSE
		SET completedOn = NULL;
		SET failedOn = NULL;
	END IF;

	-- Update the job file
	UPDATE job_file SET
		completed_on = completedOn,
		error_count = errorCount,
		failed_on = failedOn,
		info_count = infoCount,
		message = jobFileMessage,
		status_tid = statusTID,
		success_count = successCount,
		warning_count = warningCount
		
	WHERE job_id = jobID
	AND filename = jobFilename;

END //

DELIMITER ;