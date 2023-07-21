
CREATE OR REPLACE VIEW `v_job_file` AS 
SELECT 
    jf.id,
    jf.completed_on,
    jf.created_on,
    jf.error_count,
    jf.failed_on,
    jf.filename,
    jf.info_count,
    jf.job_id,
    jf.message,
    statusterm.term_key AS status,
    jf.status_tid,
    jf.success_count,
    jf.uid,
    jf.upload_order,
    jf.warning_count

FROM job_file jf
JOIN term statusterm ON statusterm.id = jf.status_tid;