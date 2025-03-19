
DROP PROCEDURE IF EXISTS `updateJob`;

DELIMITER //

CREATE PROCEDURE `updateJob`(
	IN `currentStatus` VARCHAR(100),
	IN `errorMessage` TEXT,
	IN `jobUID` VARCHAR(100),
	IN `userUID` VARCHAR(100)
)
BEGIN

	DECLARE errorCount INT;
	DECLARE fullStatus VARCHAR(100);
	DECLARE infoCount INT;
	DECLARE jobID INT;
	DECLARE jobMessage VARCHAR(300);
	DECLARE jobStatus VARCHAR(100);
	DECLARE statusTID INT;
	DECLARE successCount INT;
	DECLARE warningCount INT;
	
	
	-- Validate the jobUID
	IF jobUID IS NULL OR jobUID = '' THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid jobUID parameter';
	END IF;

	-- Validate the user UID
	IF userUID IS NULL OR LENGTH(userUID) < 1 THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid userUID parameter';
	END IF;
	
	-- Lookup the job ID
	SELECT id INTO jobID
	FROM job
	WHERE uid = jobUID
	LIMIT 1;
	
	IF jobID IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid jobID';
	END IF;

	-- Get the total status counts of all of the job's job_files.
	SELECT 
		SUM(error_count),
		SUM(info_count),
		SUM(success_count),
		SUM(warning_count)
		
		INTO errorCount, infoCount, successCount, warningCount
		
	FROM job_file
	WHERE job_id = jobID
	GROUP BY job_id;

	
	-- Use the counts to generate the job's message.
	SET jobMessage := (SELECT generateStatusMessage(errorCount, infoCount, successCount, warningCount));

	-- Determine the job's status.
	IF currentStatus IS NOT NULL AND currentStatus <> 'crashed' THEN
		IF errorCount > 0 OR warningCount > 0 THEN
			SET jobStatus := 'invalid';
		ELSE 
			SET jobStatus := 'valid';
		END IF;
	END IF;
	
	-- Get and validate the status term ID.
	SET statusTID := (SELECT id FROM term WHERE full_key = CONCAT('job_status.', jobStatus) LIMIT 1);
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status';
	END IF;
	
	
	-- Update the job with the modified values.
	UPDATE job SET
		ended_on = NOW(),
		error_count = errorCount,
		error_message = errorMessage,
		info_count = infoCount,
		message = jobMessage,
		status_tid = statusTID,
		success_count = successCount,
		warning_count = warningCount

	WHERE id = jobID;


	-- Populate the JSON fields on job_file and job.
	CALL populateJobJSON(jobID);

END //

DELIMITER ;