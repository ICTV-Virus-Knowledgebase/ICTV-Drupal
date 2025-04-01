
DROP PROCEDURE IF EXISTS `getSeqSearchResults`;

DELIMITER //

CREATE PROCEDURE `getSeqSearchResults`(
   IN `jobType` VARCHAR(60),
   IN `jobUID` VARCHAR(100),
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


   -- Get all jobs submitted by this user.
   SELECT
      created_on,
      ended_on,
      `json`,
      `message`,
      `name`,
      `status`,
      `uid`
   FROM v_job
   WHERE user_email = userEmail
   AND user_uid = userUID
   AND type_tid = typeTID
   AND (jobUID IS NULL OR (jobUID IS NOT NULL AND `uid` = jobUID))
   ORDER BY created_on DESC;

END //

DELIMITER ;