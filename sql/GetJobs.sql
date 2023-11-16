
DELIMITER //

DROP PROCEDURE IF EXISTS `getJobs`;

CREATE PROCEDURE `getJobs`(
	IN `userEmail` VARCHAR(200),
	IN `userUID` INT
)
BEGIN

   -- Validate the user email
	IF userEmail IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid userEmail parameter';
	END IF;

   -- Validate the user UID
	IF userUID IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid userUID parameter';
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
	      GROUP BY created_on
		) job_rows
	) jobs;

END //

DELIMITER ;