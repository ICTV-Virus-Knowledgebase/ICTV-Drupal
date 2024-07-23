
DELIMITER //

DROP PROCEDURE IF EXISTS `createJobFile`;

CREATE PROCEDURE `createJobFile`(
	IN `filename` VARCHAR(100),
	IN `jobID` INT,
	IN `uploadOrder` INT
)
BEGIN
	DECLARE jobFileUID VARCHAR(100);
	DECLARE statusTID INT;
	
	-- Validate the filename
	IF filename IS NULL OR LENGTH(filename) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid filename parameter';
	END IF;
	
	-- Validate the job ID
	IF jobID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job ID parameter';
	END IF;
	
	-- Lookup the term ID for the status (job files always start with "pending" status).
	SET statusTID := (
		SELECT id 
		FROM term 
		WHERE full_key = 'job_status.pending'
		LIMIT 1
	);
	
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status.pending';
	END IF;
	
	-- Generate a new job file UID
	SET jobFileUID = REPLACE(CAST(UUID() AS VARCHAR(100)),'-','');
  	
  	-- Calculate the upload order if it wasn't provided.
  	IF uploadOrder IS NULL OR uploadOrder < 0 THEN
  		
  		SET uploadOrder := (
  			SELECT MAX(upload_order)
  			FROM job_file
  			WHERE job_id = jobID
  		);
  		
  		IF uploadOrder IS NULL THEN 
  			SET uploadOrder := 0;
  		ELSE 
  			SET uploadOrder := uploadOrder + 1;
  		END IF;
		  	
  	END IF; 
  	
  	
  	-- Create the new job file record.
  	INSERT INTO job_file (
  		`filename`,
  		`job_id`,
		`status_tid`,
		`uid`,
		`upload_order`
	) VALUES (
		filename,
		jobID,
		statusTID,
		jobFileUID,
		uploadOrder
	);

    -- Return the newly-created job file UID.
	SELECT jobFileUID AS jobFileUID;

END //

DELIMITER ;