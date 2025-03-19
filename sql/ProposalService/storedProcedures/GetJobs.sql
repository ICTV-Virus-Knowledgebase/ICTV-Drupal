
DROP PROCEDURE IF EXISTS `getJobs`;

DELIMITER //

CREATE PROCEDURE `getJobs`(
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
   SELECT CASE
      WHEN jobs_json IS NULL THEN 'null'
      ELSE CONCAT('[', jobs_json, ']')
   END 
   FROM (
		SELECT REPLACE(REPLACE(GROUP_CONCAT(job_json ORDER BY created_on DESC), '"{', '{'), '}"', '}') AS jobs_json
		FROM (
	   	SELECT 
            created_on,
            job.json AS job_json
	      FROM job
	      WHERE user_email = userEmail
         AND user_uid = userUID
         AND type_tid = typeTID
	      GROUP BY created_on
		) job_rows
	) jobs;

END //

DELIMITER ;