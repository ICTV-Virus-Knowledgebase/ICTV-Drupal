
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 10/08/24
-- Description: Search the symbol relation table for a name. NOTE: this is a SQL Server script!
-- Updated:
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.searchSymbolRelations') IS NOT NULL
	DROP PROCEDURE dbo.searchSymbolRelations
GO

CREATE PROCEDURE dbo.searchSymbolRelations

	-- The max difference between the length of the search text and length of the match.
	@lengthDiff INT,

	-- The maximum number of results to return.
	@maxResults INT,

	-- Search for this name.
	@name NVARCHAR(300)
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	-- Convert the search text into "symbol relations".
	DECLARE @querySymbols TABLE (symbol_a NVARCHAR(1), symbol_b NVARCHAR(1))

	-- The length of the name we're trying to match.
	DECLARE @nameLength INT = LEN(@name)

	-- The loop will start with the 2nd name index.
	DECLARE @nameIndex INT = 2

	-- Get the first symbol.
	DECLARE @symbolA NVARCHAR(1) = SUBSTRING(@name, 1, 1)
	DECLARE @symbolB NVARCHAR(1) 

	WHILE (@nameIndex <= @nameLength)
	BEGIN

		SET @symbolB = SUBSTRING(@name, @nameIndex, 1)

		INSERT INTO @querySymbols (
			symbol_a, 
			symbol_b
		) VALUES (
			@symbolA,
			@symbolB
		)

		SET @nameIndex = @nameIndex + 1
		SET @symbolA = @symbolB
	END


	SELECT *
	FROM (
		SELECT COUNT(1) AS result_count, 
			ROW_NUMBER() OVER (ORDER BY sr.taxon_name_id) AS row_index,
			sr.taxon_name_id

		FROM @querySymbols qs
		JOIN symbol_relation sr ON (
			sr.symbol_a = qs.symbol_a 
			AND sr.symbol_b = qs.symbol_b
		)
		GROUP BY sr.taxon_name_id
	) matches
	JOIN taxon_name tn ON tn.id = matches.taxon_name_id
	WHERE LEN(tn.name) >= (@nameLength - @lengthDiff)
	AND LEN(tn.name) <= (@nameLength + @lengthDiff)
	AND row_index <= @maxResults
	ORDER BY result_count DESC

END