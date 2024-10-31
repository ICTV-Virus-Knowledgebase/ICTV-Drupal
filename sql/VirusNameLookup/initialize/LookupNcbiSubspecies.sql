
-- Clear any existing data.
DELETE FROM supspecies_lookup

-- Populate the subspecies_lookup table.
INSERT INTO subspecies_lookup (
	ictv_msl_release,
	ictv_name,
	ictv_rank_name,
	ictv_taxnode_id,
	name,
	parent_name,
	parent_rank,
	parent_tax_id,
	rank_name,
	tax_id
)

-- Find the parent taxon of NCBI subspecies and try to match it to the ICTV taxonomy_node table.
SELECT 
	ictv.msl_release_num AS ictv_msl_release,
	ictv.name AS ictv_name,
	ictv.rank_name AS ictv_rank_name,
	ictv.latest_taxnode_id AS ictv_taxnode_id,
	ncbi.name,
	ncbi.parent_name,
	ncbi.parent_rank,
	ncbi.parent_tax_id,
	ncbi.rank_name,
	ncbi.tax_id
	
FROM (
	SELECT rank_name, name, tax_id,
	parent_rank = CASE
		WHEN p1_is_taxa = 1 then p1_rank
		WHEN p2_is_taxa = 1 then p2_rank
		WHEN p3_is_taxa = 1 then p3_rank
		WHEN p4_is_taxa = 1 then p4_rank
	END,
	parent_name = CASE
		WHEN p1_is_taxa = 1 then p1_name
		WHEN p2_is_taxa = 1 then p2_name
		WHEN p3_is_taxa = 1 then p3_name
		WHEN p4_is_taxa = 1 then p4_name
	END,
	parent_tax_id = CASE
		WHEN p1_is_taxa = 1 then p1_tax_id
		WHEN p2_is_taxa = 1 then p2_tax_id
		WHEN p3_is_taxa = 1 then p3_tax_id
		WHEN p4_is_taxa = 1 then p4_tax_id
	END

	FROM (
		SELECT
			nodes.rank_name, names.name, nodes.tax_id,

			p1_nodes.rank_name AS p1_rank, p1_names.name AS p1_name, p1_nodes.tax_id AS p1_tax_id,
			p1_is_taxa = CASE WHEN p1_nodes.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END,

			p2_nodes.rank_name AS p2_rank, p2_names.name AS p2_name, p2_nodes.tax_id AS p2_tax_id,
			p2_is_taxa = CASE WHEN p2_nodes.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END,

			p3_nodes.rank_name AS p3_rank, p3_names.name AS p3_name, p3_nodes.tax_id AS p3_tax_id,
			p3_is_taxa = CASE WHEN p3_nodes.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END,

			p4_nodes.rank_name AS p4_rank, p4_names.name AS p4_name, p4_nodes.tax_id AS p4_tax_id,
			p4_is_taxa = CASE WHEN p4_nodes.rank_name IN ('class','family','genus','kingdom','order','phylum','subfamily','subgenus','superkingdom','species') THEN 1 ELSE 0 END

		FROM ncbi_names names
		JOIN ncbi_nodes nodes ON nodes.tax_id = names.tax_id

		JOIN ncbi_nodes p1_nodes ON p1_nodes.tax_id = nodes.parent_tax_id
		JOIN ncbi_names p1_names ON (
			p1_names.tax_id = p1_nodes.tax_id
			AND p1_names.name_class = 'scientific name'
		)

		JOIN ncbi_nodes p2_nodes ON p2_nodes.tax_id = p1_nodes.parent_tax_id 
		JOIN ncbi_names p2_names ON (
			p2_names.tax_id = p2_nodes.tax_id
			AND p2_names.name_class = 'scientific name'
		)

		JOIN ncbi_nodes p3_nodes ON p3_nodes.tax_id = p2_nodes.parent_tax_id
		JOIN ncbi_names p3_names ON (
			p3_names.tax_id = p3_nodes.tax_id
			AND p3_names.name_class = 'scientific name'
		)

		JOIN ncbi_nodes p4_nodes ON p4_nodes.tax_id = p3_nodes.parent_tax_id
		JOIN ncbi_names p4_names ON (
			p4_names.tax_id = p4_nodes.tax_id
			AND p4_names.name_class = 'scientific name'
		)
		where nodes.division_id IN (3, 9)
		AND names.name_class = 'scientific name'
		AND nodes.rank_name IN ('no rank','serotype','genotype','serogroup','isolate')
	) intermediate_results
) ncbi

LEFT JOIN (
	SELECT 
		tn.msl_release_num,
		latestNameAndID.name,
		tl.name AS rank_name,
		latest_taxnode_id
	FROM (
		SELECT 
			distinct_name AS name,
			latest_taxnode_id = (
				SELECT TOP 1 latest_tn.taxnode_id
				FROM [ICTVonline39].dbo.taxonomy_node latest_tn
				WHERE latest_tn.name = distinct_name
				ORDER BY latest_tn.msl_release_num DESC
			)
		FROM (
			SELECT DISTINCT distinct_tn.name AS distinct_name
			FROM [ICTVonline39].dbo.taxonomy_node distinct_tn
		) distinctNames
	) latestNameAndID
	JOIN [ICTVonline39].dbo.taxonomy_node tn ON tn.taxnode_id = latestNameAndID.latest_taxnode_id
	JOIN [ICTVonline39].dbo.taxonomy_level tl ON tl.id = tn.level_id
	WHERE tn.msl_release_num IS NOT NULL
	AND tn.taxnode_id <> tn.tree_id
) ictv ON ictv.name = ncbi.parent_name


