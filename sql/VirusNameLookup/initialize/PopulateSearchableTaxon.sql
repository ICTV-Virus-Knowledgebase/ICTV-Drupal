


/*

-- TODO: Make sure the following views have been updated to refer to the latest ICTV online database:
-- v_species_isolates
-- v_taxonomy_node_merge_split
-- v_taxonomy_node_names

DELETE FROM searchable_taxon;

-- Import records from the VMR (species_isolates)
CALL ImportLatestSpeciesIsolates();

CALL ImportLatestTaxonomyNodes();

CALL ImportIctvSpeciesEpithets();

CALL ImportNcbiScientificNames();

CALL InitializeNcbiSubspecies();

CALL ImportNcbiSubspeciesNodes();

CALL UpdateNcbiNonScientificNames();

*/

