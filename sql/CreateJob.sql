
DELIMITER //

CREATE PROCEDURE createJob (
	OUT jobUID VARCHAR(100),
	IN statusTerm VARCHAR(100),
	IN userEmail VARCHAR(100),
	IN userUID VARCHAR(100)
)
BEGIN

	print 'inside createJob'
	
	DECLARE statusTID INT := (
		SELECT id 
		FROM term 
		WHERE full_key = 'job_status.'+statusTerm
		LIMIT 1
	);
	
	SET jobUID = UUID()
  	

END;

DELIMITER ;