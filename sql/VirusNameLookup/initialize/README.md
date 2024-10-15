# Setting up the database for Virus Name Lookup 


## Create the database schema in MariaDB

### Tables

- Populate the vocabulary and term tables using **InitializeVocabularyAndTerms.sql**. The script will also create the tables if they don't already exist.
- Run **CreateTaxonNameTable.sql** to create the taxon_name table.
- Run **CreateTaxonHistogramTable.sql** to create the taxonomy_histogram table.

### NCBI Taxonomy tables
- Download NCBI Taxonomy data export files
  - Taxonomy nodes file: nodes.dmp
  - Taxonomy names file: names.dmp
  - Divisions file: division.dmp
- Run **CreateNcbiTaxonomyTables.sql** to create the ncbi_names, ncbi_nodes, and ncbi_division tables.
- Import the dmp files into the NCBI Taxonomy tables.
- After the tables have been populated, run **InitializeNcbiTermIdColumns.sql** to initialize their (custom) term ID columns.
- Run **PopulateTaxonNameFromNCBI.sql** to import NCBI Taxonomy into the taxon_name table.


### Create (but don't call) stored procedures and user-defined functions
- **AddNameToTaxonHistogram.sql**: Called by PopulateTaxonHistogram to add an entry in the taxon_histogram.
- **GetFilteredName.sql**: Filters punctuation and special characters from name text.
- **ImportTaxonName.sql**: Called by the Python scripts that import species_isolates and taxonomy_node from TSV files.
- **PopulateTaxonHistogram.sql**: Create a taxon_histogram record for every taxon_name record.
- **PopulateTaxonNameFromNCBI.sql**: Import data from the ncbi_names and ncbi_nodes tables into taxon_name.
- **SearchTaxonHistogram.sql**: Search the taxon_histogram table for search text provided by the user.


### Create SQL views
- **v_taxon_name.sql**: A view for taxon_name that resolves term IDs.

### Export ICTV data from SQL Server
- Species_isolates (TODO)
- Taxonomy_node (TODO)

### Import the ICTV data into the taxon_name table
- Species_isolates (TODO)
- Taxonomy_node (TODO)

