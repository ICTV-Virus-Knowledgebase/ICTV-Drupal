
-- Map NCBI Taxonomy virus and phage names to ICTV taxonomy_node records, specifically the
-- version with the latest MSL.

/*
INSERT INTO [VirusLookup].dbo.taxonomy_node_ncbi_map (
	[name],
	latest_msl,
	latest_taxnode_id,
	ictv_rank,
	ncbi_rank,
	ncbi_tax_id,
	ncbi_division,
	ncbi_name_class
)
*/
SELECT
	latestTN.name,
	latestTN.latestMSL,
	latestTN.latestTaxnodeID,
	latestTN.rank_name AS ictv_rank,
	nnode.rank_name AS ncbi_rank,
	nname.tax_id AS ncbi_tax_id,
	d.name AS ncbi_division,
	nname.name_class
FROM (
	SELECT distinct tn.name,
		latestMSL = (
			SELECT TOP 1 msl.msl_release_num
			FROM taxonomy_node msl
			WHERE msl.name = tn.name
			AND msl.msl_release_num IS NOT NULL
			ORDER BY msl.msl_release_num DESC
		),
		latestTaxnodeID = (
			SELECT TOP 1 tnid.taxnode_id
			FROM taxonomy_node tnid
			WHERE tnid.name = tn.name
			AND tnid.msl_release_num IS NOT NULL
			ORDER BY tnid.msl_release_num DESC
		),
		tl.name as rank_name
	FROM taxonomy_node tn
	JOIN taxonomy_level tl ON tl.id = tn.level_id
	WHERE tn.taxnode_id <> tn.tree_id
) latestTN
JOIN [NCBI_TAXONOMY].dbo.ncbi_names nname ON nname.name = latestTN.name
JOIN [NCBI_TAXONOMY].dbo.ncbi_nodes nnode ON nnode.tax_id = nname.tax_id
JOIN [NCBI_TAXONOMY].dbo.division d ON d.id = nnode.division_id
WHERE latestMSL IS NOT NULL
AND nnode.division_id IN (3, 9) -- phages and viruses
AND nnode.parent_tax_id > 1
ORDER BY latestTN.name
