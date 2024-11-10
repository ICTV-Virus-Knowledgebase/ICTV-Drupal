

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 10/08/24
-- Description: Populate the symbol relation table with taxon_name records. NOTE: this is a SQL Server script!
-- Updated:
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.populateSymbolRelations') IS NOT NULL
	DROP PROCEDURE dbo.populateSymbolRelations
GO

CREATE PROCEDURE dbo.populateSymbolRelations
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	DECLARE @name NVARCHAR(300)
	DECLARE @taxonNameID INT


	--==========================================================================================================
	-- Clear any existing records in symbol_relation.
	--==========================================================================================================
	DELETE FROM symbol_relation


	--==========================================================================================================
	-- Iterate over every row in taxon_name.
	--==========================================================================================================
	DECLARE taxaCursor CURSOR FOR
		SELECT 
			filtered_name,
			id
		FROM taxon_name

	OPEN taxaCursor
	FETCH NEXT FROM taxaCursor INTO @name, @taxonNameID

	WHILE @@FETCH_STATUS = 0
	BEGIN

		DECLARE @nameLength INT = LEN(@name)

		-- The loop will start with the 2nd name index.
		DECLARE @nameIndex INT = 2

		DECLARE @symbolA NVARCHAR(1) 
		DECLARE @symbolB NVARCHAR(1) 

		-- Get the first symbol.
		SET @symbolA = SUBSTRING(@name, 1, 1)
		
		WHILE (@nameIndex <= @nameLength)
		BEGIN
			-- Get the second symbol in the relation.
			SET @symbolB = SUBSTRING(@name, @nameIndex, 1)

			INSERT INTO symbol_relation (
				symbol_a, 
				symbol_b, 
				taxon_name_id
			) VALUES (
				@symbolA,
				@symbolB,
				@taxonNameID
			)

			-- Increment the name index.
			SET @nameIndex = @nameIndex + 1

			-- The second symbol will be the first symbol in the next iteration.
			SET @symbolA = @symbolB

		END

		-- Fetch the next row
		FETCH NEXT FROM taxaCursor INTO @name, @taxonNameID
	END

	-- Close and deallocate the cursor
	CLOSE taxaCursor
	DEALLOCATE taxaCursor

END

