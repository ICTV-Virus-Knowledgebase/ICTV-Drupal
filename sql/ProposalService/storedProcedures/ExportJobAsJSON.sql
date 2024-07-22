
DELIMITER //

DROP PROCEDURE IF EXISTS `exportJobsAsJSON`;

CREATE PROCEDURE `exportJobsAsJSON`(
	IN `userEmail` VARCHAR(200),
	IN `userUID` INT
)
BEGIN

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
	) AS jobs;

END //

DELIMITER ;