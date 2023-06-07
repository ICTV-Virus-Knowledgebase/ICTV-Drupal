
DELIMITER //

CREATE PROCEDURE createJob (
	OUT jobUID VARCHAR(100),
	IN statusTerm VARCHAR(100),
	IN userEmail VARCHAR(100),
	IN userUID VARCHAR(100)
)
BEGIN
	
	-- Declare variables used below.
	DECLARE jobUID VARCHAR(100);
	DECLARE statusTID INT;
	
	
	-- Validate the filename
	IF filename IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid filename parameter';
	END IF;
	
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
		WHERE full_key = CONCAT('job_status.pending')
		LIMIT 1
	);
	
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status.pending';
	END IF;
	
	-- Generate a new job UID
	SET jobUID = REPLACE(CAST(UUID() AS VARCHAR(100)),'-','');
  	
  	
  	-- Create the new job record.
  	INSERT INTO job (
  		`filename`,
		`status_tid`,
		`uid`,
		`user_email`,
		`user_uid`
	) VALUES (
		filename,
		statusTID,
		jobUID,
		userEmail,
		userUID
	);

	SELECT jobUID;

END;

DELIMITER ;