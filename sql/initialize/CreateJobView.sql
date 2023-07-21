
CREATE OR REPLACE VIEW `v_job` AS 
SELECT 
	j.id,
	j.completed_on,
	j.created_on,
	j.error_message,
	j.failed_on,
	j.message,
	j.name,
	statusterm.term_key AS status,
	j.status_tid,
	typeterm.term_key AS type,
	j.type_tid,
	j.uid,
	j.user_email,
	j.user_uid
	
FROM job j
JOIN term statusterm ON statusterm.id = status_tid
LEFT JOIN term typeterm ON typeterm.id = type_tid  ;