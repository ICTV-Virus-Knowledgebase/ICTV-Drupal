
-- Updates
-- 01/09/25: Now excluding hidden and deleted taxonomy_node records.

-- Delete any existing records from the table.
DELETE FROM latest_release_of_ictv_id;


-- Add an ICTV ID and its latest MSL release.
INSERT INTO latest_release_of_ictv_id (
  ictv_id,
  latest_msl_release
)

-- Get distinct ICTV IDs and the latest MSL release in which the ID appears.
SELECT
	distinct_ictv_id,
	(
      SELECT tn2.msl_release_num
      FROM v_taxonomy_node_names tn2
      WHERE tn2.ictv_id = distinct_ictv_id
      AND tn2.tree_id <> tn2.taxnode_id
      AND tn2.msl_release_num IS NOT NULL
      ORDER BY tn2.msl_release_num DESC
      LIMIT 1
	) AS latest_msl_release
FROM (
	SELECT DISTINCT tn1.ictv_id AS distinct_ictv_id
	FROM v_taxonomy_node_names tn1
   WHERE tn1.tree_id <> tn1.taxnode_id
   AND tn1.msl_release_num IS NOT NULL
) distinctIDs;