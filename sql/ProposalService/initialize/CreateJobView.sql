
CREATE OR REPLACE VIEW `v_job` AS 
SELECT 
	j.id,
	j.created_on,
	j.ended_on,
	j.error_count,
	j.error_message,
	j.info_count,
	j.json,
	j.message,
	j.name,
	statusterm.term_key AS status,
	j.status_tid,
	j.success_count,
	j.uid,
	j.user_email,
	j.user_uid,
	j.warning_count
	
FROM job j
JOIN term statusterm ON statusterm.id = status_tid;