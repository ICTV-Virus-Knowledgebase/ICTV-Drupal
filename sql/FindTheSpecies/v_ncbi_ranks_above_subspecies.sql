
-- A view that returns NCBI taxonomy ranks above subspecies.
CREATE OR REPLACE VIEW v_ncbi_ranks_above_subspecies AS

SELECT 'realm' AS rank_name

UNION ALL
SELECT 'kingdom'

UNION ALL
SELECT 'phylum'

UNION ALL
SELECT 'subphylum'

UNION ALL
SELECT 'class'

UNION ALL
SELECT 'order'

UNION ALL
SELECT 'suborder'

UNION ALL
SELECT 'family'

UNION ALL
SELECT 'subfamily'

UNION ALL
SELECT 'genus'

UNION ALL
SELECT 'subgenus'

UNION ALL
SELECT 'species'