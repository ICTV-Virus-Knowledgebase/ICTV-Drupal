
-- TODO: Make sure the name of the current ICTVonline* database is correct!

CREATE OR REPLACE VIEW `v_species_isolates` AS 

SELECT *
FROM ictv_taxonomy.species_isolates;