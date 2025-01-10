
DROP FUNCTION IF EXISTS `getFilteredName`

DELIMITER //

CREATE FUNCTION `getFilteredName`(`name` TEXT) RETURNS TEXT
BEGIN

	DECLARE filteredName TEXT;
	
	SET filteredName = 
	REPLACE(
		REPLACE(
			REPLACE(
				REPLACE(
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(
											REPLACE(
												REPLACE(
													REPLACE(
														REPLACE(
															REPLACE(NAME, '-', ' ')
														, '_', ' ')
													, '`', '')
												, '"', '')
											, '''', '')
										, '!', '')
									, '?', '')
								, '  ', ' ')
							, '(', ',')
						, ')', ',')
					, ';', ',')
				, ':', ',')
			, ',,', ',')
		, '/', ' ')
	, '\\', ' ');
	
	RETURN filteredName;
   
END//
DELIMITER ;