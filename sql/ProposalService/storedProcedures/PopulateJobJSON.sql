
DELIMITER //

DROP PROCEDURE IF EXISTS `populateJobJSON`;

CREATE PROCEDURE `populateJobJSON`(
	IN `jobID` INT
)
BEGIN

    -- Update the JSON of every job_file associated with this job.
    UPDATE job_file SET json = (
        CONCAT('{ ',
            '"endedOn": ', CASE
                WHEN ended_on IS NULL THEN 'null' ELSE CONCAT('"', ended_on, '"')
            END, ', ',

            '"errorCount": ', CAST(error_count AS VARCHAR(10)),', ',

            '"filename": "', filename,'", ',

            '"infoCount": ', CAST(info_count AS VARCHAR(10)),', ',

            '"message": ', CASE
                WHEN message IS NULL THEN 'null' ELSE CONCAT('"', message, '"')
            END, ', ',

            '"startedOn": "', created_on, '", ',

            '"status": "', (SELECT term_key FROM term t WHERE t.id = status_tid LIMIT 1),  '", ',

            '"successCount": ',CAST(success_count AS VARCHAR(10)), ', ',

            '"uid": "', uid, '", ',

            '"uploadOrder": ', CAST(upload_order AS VARCHAR(10)), ', ',

            '"warningCount": ', CAST(warning_count AS VARCHAR(10)), ' ',
        '}')
    )
    WHERE job_id = jobID;


    -- Populate the job's JSON and include the JSON from its job files.
    UPDATE job SET json = (
        CONCAT('{ ',
            '"createdOn": "', created_on, '", ',

            '"endedOn": ', CASE
                WHEN ended_on IS NULL THEN 'null' ELSE CONCAT('"', ended_on, '"')
            END, ', ',
            
            '"files": ', (
               SELECT CASE
                  WHEN json IS NULL THEN 'null'
                  ELSE CONCAT('[', json, ']')
               END
               FROM (
                  SELECT GROUP_CONCAT(jf.json) AS json
                  FROM job_file jf
                  WHERE jf.job_id = jobID
                  ORDER BY jf.upload_order ASC
                  LIMIT 10000000
               ) jobFiles
            ), ', ',
            
            '"message": ', CASE 
                WHEN message IS NULL THEN 'null' ELSE CONCAT('"', message, '"')
            END, ', ',
            
            '"name": ', CASE 
                WHEN name IS NULL THEN 'null' ELSE CONCAT('"', name, '"')
            END, ', ',
            
            '"status": "', (SELECT term_key FROM term t WHERE t.id = status_tid LIMIT 1), '", ',
            
            '"uid": "', uid, '" ',
        '} ') 
    )
    WHERE id = jobID;

END //

DELIMITER ;