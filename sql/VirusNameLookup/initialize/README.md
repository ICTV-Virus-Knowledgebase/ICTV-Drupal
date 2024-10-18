# Setting up the database for Virus Name Lookup 


## Create the database schema in MariaDB

### Tables

- Populate the vocabulary and term tables using **InitializeVocabularyAndTerms.sql**. The script will also create the tables if they don't already exist.
- Run **CreateTaxonNameTable.sql** to create the taxon_name table.
- Run **CreateTaxonHistogramTable.sql** to create the taxonomy_histogram table.
- Run **CreateNcbiTaxonomyTables.sql** to create the ncbi_names, ncbi_nodes, and ncbi_division tables.

### NCBI Taxonomy tables
- Download NCBI Taxonomy data export files
  - Taxonomy nodes file: nodes.dmp
  - Taxonomy names file: names.dmp
  - Divisions file: division.dmp

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


### Import the ICTV data into the taxon_name table
- **Goal**: Import data from the species_isolates and taxonomy_node table into taxon_name.
- The current (10/18/24) process for data transfer is different from how we will tranfer data in the future:
  - Since the ICTV data is currently maintained in a SQL Server database on a Windows server, we need to export it as TSV files and then import those TSV files into the taxon_name table.
  - In the near future, however, the species_isolates and taxonomy_node tables will exist in a MariaDB database on the same server as the Virus Name Lookup tables.
  - To export the species_isolates table:
    - Make sure that the stored procedure **exportSpeciesIsolatesAsTSV" exists in SQL Server (its filename is **ExportSpeciesIsolatesAsTSV_SQL_Server.sql).
    - Run `py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "species_isolates"` replacing the values of ***--dbServer*** and ***--ictvDB*** if appropriate. This will create the file **speciesIsolates.tsv** in the output directory where the Python code is located.
    - Copy the TSV file to where it can be FTP-ed to the *ictv.global server and imported into MariaDB.
  - To export the taxonomy_node table:
    - Make sure the stored procedure **exportTaxonomyNodesAsTSV** exists in SQL Server (its filename is **ExportTaxonomyNodesAsTSV_SQL_Server.sql**).
    - To export all MSL releases in taxonomy_node, run `py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "all_taxonomy_nodes"` replacing the values of ***--dbServer*** and ***--ictvDB*** if appropriate. This will create a **taxonomyNodes_msl[release].tsv** file in the output directory for every MSL release.
    - To export a single MSL release of taxonomy_node, run `py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "taxonomy_node" --msl [release number]` specifying the desired MSL release number after ***--msl*** and replacing ***--dbServer*** and ***--ictvDB*** if appropriate.
  - To import the **output/speciesIsolates.tsv** file into taxon_name, run `py ./importSpeciesIsolates.py --filename output/speciesIsolatesTest.tsv --dbName virus_name_lookup --host localhost --username [username] --password [password] --port 3306` replacing [username], [password], or other values where necessary.
  - To import all **output/taxonomyNodes_msl[release].tsv** files into taxon_name, run `py ./importTaxonomyNodes.py --dbName virus_name_lookup --host localhost --username [username] --password [password] --port 3306 --all 1` replacing [username], [password], or other values where necessary.
  - To import a single **output/taxonomyNodes_msl[release].tsv** file into taxon_name, run `py ./importTaxonomyNodes.py --filename output/taxonomyNodes_msl[release].tsv --dbName virus_name_lookup --host localhost --username [username] --password [password] --port 3306` replacing [username], [password], or other values where necessary.
