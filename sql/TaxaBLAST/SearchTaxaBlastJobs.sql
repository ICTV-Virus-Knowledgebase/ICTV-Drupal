
DROP PROCEDURE IF EXISTS `searchTaxaBlastJobs`;

DELIMITER //

CREATE PROCEDURE `searchTaxaBlastJobs`(
   IN `jobType` VARCHAR(60),
   IN `searchText` VARCHAR(100),
   IN `userUID` VARCHAR(100)
)
BEGIN
   -- Declare variables used below.
   DECLARE typeTID INT;

   IF searchText IS NOT NULL AND LENGTH(searchText) < 1 THEN
      SET searchText = NULL;
   END IF;

   -- Validate the user UID.
   IF userUID IS NULL OR userUID < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user UID parameter';
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


   -- Search jobs created by this user.
   SELECT
      created_on,
      CASE 
         WHEN ended_on IS NULL THEN TIMESTAMPDIFF(SECOND, created_on, NOW())
         ELSE TIMESTAMPDIFF(SECOND, created_on, ended_on)
      END AS duration_in_seconds,
      ended_on,
      j.json,
      j.message,
      j.name,
      j.status,
      j.uid      
   FROM v_job j
   WHERE j.user_uid = userUID
   AND j.type_tid = typeTID
   AND (searchText IS NULL OR (
      j.json LIKE CONCAT('%',HEX(searchText),'%')
      OR j.name LIKE CONCAT('%',searchText,'%')
   ))
   ORDER BY j.created_on DESC;

END //

DELIMITER ;