
DELIMITER //

DROP PROCEDURE IF EXISTS `updateJob`;

CREATE PROCEDURE `updateJob`(
	IN `errorMessage` TEXT,
	IN `jobUID` VARCHAR(100),
	IN `message` TEXT,
	IN `status` VARCHAR(50),
	IN `userUID` INT
)
BEGIN
	DECLARE fullStatus VARCHAR(100);
	DECLARE jobID INT;
	DECLARE statusTID INT;
	
	-- Validate the jobUID
	IF jobUID IS NULL OR jobUID = '' THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid jobUID parameter';
	END IF;

	-- Validate the user UID
	IF userUID IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid userUID parameter';
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
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for status parameter';
	END IF;

  
	-- The status determines how the job is updated.
	IF status = 'valid' THEN
		
		-- Update the job as completed.
		UPDATE job SET
			completed_on = NOW(),
			error_message = errorMessage,
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	ELSEIF status IN ('invalid', 'crashed') THEN
		
		-- Update the job as invalid or crashed and include the message and error message.
		UPDATE job SET
			error_message = errorMessage,
			failed_on = NOW(), 
			message = message,
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	END IF;

	-- Return the job ID.
	SELECT id AS jobID
	FROM job
	WHERE uid = jobUID
	LIMIT 1;
	
END //

DELIMITER ;