
DROP PROCEDURE IF EXISTS `getSeqSearchJob`;

DELIMITER //

CREATE PROCEDURE `getSeqSearchJob`(
   IN `jobType` VARCHAR(60),
   IN `jobUID` VARCHAR(100)
)
BEGIN

   -- Declare variables used below.
   DECLARE typeTID INT;

   -- Validate the job UID.
   IF jobUID  IS NULL OR LENGTH(jobUID) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job UID parameter';
   END IF;

   -- Validate the job type
   IF jobType IS NULL OR LENGTH(jobType) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid job type parameter';
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


   -- Get the job with the specified UID.
   SELECT
      created_on,
      ended_on,
      `json`,
      `message`,
      `name`,
      `status`,
      `uid`
   FROM v_job
   WHERE `uid` = jobUID
   AND type_tid = typeTID
   LIMIT 1;

END //

DELIMITER ;