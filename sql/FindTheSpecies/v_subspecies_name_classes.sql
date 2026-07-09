
-- A view that returns subspecies name classes.
CREATE OR REPLACE VIEW v_subspecies_name_classes AS

SELECT 'genotype' AS name_class

UNION ALL
SELECT 'isolate'

UNION ALL
SELECT 'no rank'

UNION ALL
SELECT 'serogroup'

UNION ALL
SELECT 'serotype'

UNION ALL
SELECT 'subspecies'