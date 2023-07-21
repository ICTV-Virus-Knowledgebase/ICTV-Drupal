
DELIMITER //

DROP PROCEDURE IF EXISTS initializeIctvSettings;

CREATE PROCEDURE initializeIctvSettings (
	IN authToken VARCHAR(2048),
	IN drupalWebServiceURL VARCHAR(2048)
)
BEGIN

	DECLARE tempAuthToken VARCHAR(2048);
	DECLARE tempDrupalWebServiceURL VARCHAR(2048);
	
	-- Is "authToken" already a setting?
	SET tempAuthToken := (
		SELECT a.value
		FROM ictv_settings a
		WHERE a.NAME = 'authToken'
	);
	
	-- Is "drupalWebServiceURL" already a setting?
	SET tempDrupalWebServiceURL := (
		SELECT d.value
		FROM ictv_settings d
		WHERE d.NAME = 'drupalWebServiceURL'
	);
	
	IF tempAuthToken IS NULL THEN
	
		-- Add a setting for "authToken"
		INSERT INTO ictv_settings (
			description,
			NAME,
			updated_by,
			VALUE 
		) VALUES (
			'JWT auth token',
			'authToken',
			1,
			authToken
		);
	
	END IF;
	 
	 
	IF tempDrupalWebServiceURL IS NULL THEN
	
		-- Add a setting for "Drupal web service URL"
		INSERT INTO ictv_settings (
			description,
			NAME,
			updated_by,
			VALUE 
		) VALUES (
			'Drupal web service URL',
			'drupalWebServiceURL',
			1,
			drupalWebServiceURL
		);
	
	END IF;

	
END //

DELIMITER ;
