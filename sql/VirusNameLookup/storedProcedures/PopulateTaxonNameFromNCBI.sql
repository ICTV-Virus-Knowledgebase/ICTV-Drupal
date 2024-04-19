
DELIMITER //

CREATE OR REPLACE PROCEDURE populateTaxonNameFromNCBI()
BEGIN
  
  
	-- TODO: What should we do if taxon_name already has NCBI Taxonomy records?
	
	DECLARE taxonomyDbTID INT DEFAULT NULL;
	
	-- ====================================================================================================
	-- Lookup the term ID for the NCBI taxonomy DB.
	-- ====================================================================================================
	SET taxonomyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy' LIMIT 1);
	IF taxonomyDbTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid term ID for taxonomy_db.ncbi_taxonomy';
	END IF;
	
	
	-- ====================================================================================================
	-- Create taxon_name records from (a subset of) NCBI Taxonomy.
	-- ====================================================================================================
	INSERT INTO taxon_name (
		division_tid,
		filtered_name,
		is_valid,
		name,
		name_class_tid,
		parent_taxonomy_id,
		rank_name,
		rank_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version
	)
	
	SELECT 
		d.tid AS division_tid,
		LOWER(
			REPLACE( 
				REPLACE( 
					REPLACE(
						REPLACE(
							REPLACE(
								REPLACE(
									REPLACE(
										REPLACE(nname.name_txt, '-', ' ')
									, '_',' ')
								, '"', '')
							, '?', '')
						, '`', '')
					, '''', '')
				, '!', '')
			, '.', '')
		) AS filtered_name,
		1 AS is_valid,
		nname.name_txt AS name,
		nname.name_class_tid,
		nnode.parent_tax_id AS parent_taxonomy_id,
		nnode.rank_name,
		nnode.rank_name_tid,
		taxonomyDbTID AS taxonomy_db_tid,
		nnode.tax_id AS taxonomy_id,
		0 AS VERSION
		
	FROM ncbi_node nnode
	JOIN ncbi_division d ON d.id = nnode.division_id
	JOIN ncbi_name nname ON nname.tax_id = nnode.tax_id
	WHERE nname.name_class_tid IS NOT NULL 
	AND d.tid IN (
		SELECT divTerm.id
		FROM term divTerm
		WHERE divTerm.full_key IN (
			'ncbi_division.bacteria',
			'ncbi_division.environmental_samples',
			'ncbi_division.phages',
			'ncbi_division.synthetic_and_chimeric',
			'ncbi_division.unassigned',
			'ncbi_division.viruses'
		)
	);
	
END;

//

DELIMITER ;


