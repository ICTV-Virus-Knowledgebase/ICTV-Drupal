
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 09/21/22
-- Description: Initialize the taxonomy_json.json column
-- Updated: 04/20/23 dmd: Now displaying "" instead of null in child_counts.
--          07/19/23 dmd: Included "json_id" attribute in JSON column (taxonomy_json.id), 
--                        Replaced specific references to an ICTVonline* db with views.
--          04/25/24 dmd: Renaming taxon_json to taxonomy_json, replacing views with ICTV tables. 
--          06/28/24 dmd: Species nodes are now included in the JSON (and not the species_json column)
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.initializeJsonColumn') IS NOT NULL
	DROP PROCEDURE dbo.initializeJsonColumn
GO

CREATE PROCEDURE dbo.initializeJsonColumn
	@treeID AS INT
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	--==========================================================================================================
	-- Populate the JSON column of every taxonomy_json record.
	--==========================================================================================================
	UPDATE tj SET [json] = 
		'"child_counts":'+CASE
			WHEN tj.child_counts IS NULL OR LEN(tj.child_counts) < 1 THEN 'null' ELSE '"'+tj.child_counts+'"'
		END +','+
		'"has_assigned_siblings":'+CASE
			WHEN ISNULL(tj.has_assigned_siblings, 0) = 0 THEN 'false' ELSE 'true'
		END +','+
		'"has_species":'+CAST(ISNULL(tj.has_species, 0) AS VARCHAR(1))+','+
		'"is_assigned":'+CASE
			WHEN tj.is_ghost_node = 1 THEN 'false' ELSE 'true'
		END +','+
		'"has_unassigned_siblings":'+CASE
			WHEN ISNULL(tj.has_unassigned_siblings, 0) = 0 THEN 'false' ELSE 'true'
		END +','+
		'"name":'+CASE
			WHEN tn.name IS NULL THEN '"Unassigned"' ELSE '"'+tn.name+'"'
		END +','+
		'"parentDistance":'+CAST(ISNULL(tj.parent_distance,1) AS VARCHAR(2))+','+
      '"parentTaxNodeID":'+CASE
	      WHEN tj.parent_taxnode_id IS NULL THEN 'null' ELSE CAST(tj.parent_taxnode_id AS VARCHAR(12))
      END +','+
		'"rankIndex":'+CAST(tj.rank_index AS VARCHAR(2))+','+
		'"rankName":"'+tr.rank_name+'",' +
		'"taxNodeID":'+CASE
			WHEN tj.taxnode_id IS NULL THEN 'null' ELSE CAST(tj.taxnode_id AS VARCHAR(12))
		END +','

	FROM taxonomy_json tj
	JOIN taxonomy_json_rank tr ON (
		tr.rank_index = tj.rank_index
		AND tr.tree_id = @treeID
	)
	LEFT JOIN taxonomy_node tn ON tn.taxnode_id = tj.taxnode_id
	WHERE tj.tree_id = @treeID

	
	-- Variables used by ranked_node_cursor
	DECLARE @id AS INT
	DECLARE @rankIndex AS INT
	DECLARE @taxNodeID AS INT

	--==========================================================================================================
	-- Iterate over all ranks from the lowest (species) to the highest level rank (realm).
	--==========================================================================================================
	DECLARE ranked_node_cursor CURSOR FOR
		
		SELECT 
			tj.id,
			tj.rank_index,
			tj.taxnode_id

		FROM taxonomy_json tj
		WHERE tj.tree_id = @treeID
		ORDER BY tj.rank_index DESC

	OPEN ranked_node_cursor  
	FETCH NEXT FROM ranked_node_cursor INTO @id, @rankIndex, @taxNodeID

	WHILE @@FETCH_STATUS = 0  
	BEGIN

		-- Populate the taxonomy_json's "child JSON"
		DECLARE @childJSON AS NVARCHAR(MAX) = (
			SELECT child_json = STRING_AGG(nodeJSON, ',')
			FROM (
				SELECT TOP 10000000 nodeJSON = '{' +
					tj.json +
					'"children":'+ CASE
						WHEN tj.child_json IS NULL OR LEN(tj.child_json) < 1 THEN 'null' ELSE '['+tj.child_json+']'
					END +
				'}'
				FROM taxonomy_json tj
				LEFT JOIN taxonomy_node tn ON tn.taxnode_id = tj.taxnode_id
				WHERE tj.parent_id = @id
				AND tj.tree_id = @treeID
				
				-- We want the higher ranks first (Ex. families before subfamilies), non-ghost nodes 
				-- before ghost nodes, and then sort alphabetically.
				ORDER BY tj.rank_index ASC, tj.is_ghost_node ASC, tn.name ASC
			) childJSON
		)

		-- Update the taxonomy_json's child JSON column.
		UPDATE taxonomy_json SET child_json = @childJSON WHERE id = @id

		FETCH NEXT FROM ranked_node_cursor INTO @id, @rankIndex, @taxNodeID
	END 

	CLOSE ranked_node_cursor  
	DEALLOCATE ranked_node_cursor 
END