
DROP PROCEDURE IF EXISTS `exportJobsAsJSON`;

DELIMITER //

CREATE PROCEDURE `exportJobsAsJSON`(
   IN `jobType` VARCHAR(60),
	IN `userEmail` VARCHAR(200),
	IN `userUID` VARCHAR(100)
)
BEGIN

   -- Declare variables used below.
   DECLARE typeTID INT;

   -- Validate the job type
   IF jobType IS NULL OR LENGTH(jobType) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job type parameter';
   END IF;

   -- Validate the user email
	IF userEmail IS NULL OR LENGTH(userEmail) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user email parameter';
	END IF;
	
	-- Validate the user UID
	IF userUID IS NULL OR LENGTH(userUID) < 1 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user UID parameter';
	END IF;


   -- Lookup the term ID for the job type.
	SET typeTID = (
		SELECT id 
		FROM term 
		WHERE full_key = CONCAT('job_type.', jobType)
		LIMIT 1
	);
   
   IF typeTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job type parameter';
	END IF;

   
   -- Return all of the user's jobs as JSON.
	SELECT GROUP_CONCAT(job_json SEPARATOR ',') AS json
	FROM (
		SELECT CONCAT( 
			'{',
			'"createdOn":', CASE
				WHEN j.created_on IS NULL THEN 'null'
				ELSE CONCAT('"',CAST(j.created_on AS VARCHAR(30)),'"')
			END, ',',
			
			'"endedOn":', CASE 
				WHEN j.ended_on IS NULL THEN 'null'
				ELSE CONCAT('"',CAST(j.ended_on AS VARCHAR(30)),'"')
			END, ',',
			
         '"files":[', IFNULL((
				SELECT GROUP_CONCAT(
				   JSON_OBJECT('filename', filename, 'message', message, 'status', status, 'uid', uid)
				   ORDER BY upload_order ASC
				   SEPARATOR ','
				) AS files
				FROM v_job_file
				WHERE job_id = j.id
			), 'null'), '],',

			'"message":', CASE
				WHEN j.message IS NOT NULL THEN CONCAT('"',j.message,'"')
				ELSE 'null'
			END, ',',
			
			'"name":', CASE
				WHEN j.name IS NOT NULL THEN CONCAT('"',j.name,'"')
				ELSE 'null'
			END, ',',
			
			'"status":', CASE
				WHEN j.status IS NOT NULL THEN CONCAT('"',j.status,'"')
				ELSE 'null'
			END, ',',
			
			'"uid":', CASE
				WHEN j.uid IS NOT NULL THEN CONCAT('"',j.uid,'"')
				ELSE 'null'
			END,

			'}'
		) AS job_json
		              
		FROM v_job j
		WHERE j.user_uid = userUID
		AND j.user_email = userEmail
      AND j.type_tid = typeTID
      ORDER BY j.created_on DESC
	) AS jobs;

END //

DELIMITER ;