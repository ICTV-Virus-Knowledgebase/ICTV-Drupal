
DELIMITER //

DROP PROCEDURE IF EXISTS updateJob;

CREATE PROCEDURE updateJob (
	IN jobUID VARCHAR(100),
	IN message TEXT,
	IN status VARCHAR(50),
	IN userUID INT
)
BEGIN

	DECLARE fullStatus VARCHAR(100);
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

	/*IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status parameter'
	END IF;*/

  
	-- The status determines how the job is updated.
	IF status = 'completed' THEN
		
		-- Update the job as completed.
		UPDATE job SET
			completed_on = NOW(),
            message = message,
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	ELSEIF status = 'failed' THEN
		
		-- Update the job as failed and include the error message.
		UPDATE job SET
			failed_on = NOW(), 
			message = message,
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	ELSEIF status = 'running' THEN

		-- Update the job as running.
		UPDATE job SET status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	END IF;

END //

DELIMITER ;