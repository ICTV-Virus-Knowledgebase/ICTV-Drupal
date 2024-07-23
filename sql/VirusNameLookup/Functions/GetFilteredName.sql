DELIMITER //
CREATE FUNCTION `getFilteredName`(`name` NVARCHAR(300)
) RETURNS varchar(300) CHARSET utf8mb3 COLLATE utf8mb3_general_ci
BEGIN

	DECLARE filteredName NVARCHAR(300);
	
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