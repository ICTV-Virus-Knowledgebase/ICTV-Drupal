
DELIMITER //

CREATE PROCEDURE createJob (
	IN jobName VARCHAR(100),
	IN userEmail VARCHAR(100),
	IN userUID VARCHAR(100)
)
BEGIN

	-- Declare variables used below.
    DECLARE jobCount INT;
	DECLARE jobUID VARCHAR(100);
	DECLARE statusTID INT;
    DECLARE today DATE;
	
	-- Validate the user email
	IF userEmail IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user email parameter';
	END IF;
	
	-- Validate the user UID
	IF userUID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user UID parameter';
	END IF;
	
	-- Lookup the term ID for the status (jobs always start with "pending" status).
	SET statusTID := (
		SELECT id 
		FROM term 
		WHERE full_key = 'job_status.pending'
		LIMIT 1
	);
	
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status.pending';
	END IF;
	
	-- Generate a new job UID
	SET jobUID = REPLACE(CAST(UUID() AS VARCHAR(100)),'-','');
  	

    -- Provide a default job name if nothing was provided.
    IF jobName IS NULL OR LENGTH(jobName) < 1 THEN

        SET today = CURDATE();

        -- Add one to the number of jobs created today.
        SET jobCount = (
            SELECT COUNT(*)
            FROM v_job 
            WHERE user_uid = userUID
            AND CAST(created_on AS DATE) = today
        ) + 1;

        -- Create a default job name.
        SET jobName = CONCAT(CAST(DATE_FORMAT(today,'%m/%d/%Y') AS VARCHAR(10)), ' #', CAST(jobCount AS VARCHAR(4)));
    END IF;

    
  	-- Create the new job record.
  	INSERT INTO job (
  		`name`,
		`status_tid`,
		`uid`,
		`user_email`,
		`user_uid`
	) VALUES (
		jobName,
		statusTID,
		jobUID,
		userEmail,
		userUID
	);

    -- Return the newly-created job ID, the job name, and the generated job UID.
	SELECT LAST_INSERT_ID() AS jobID, jobName, jobUID;

END;

DELIMITER ;