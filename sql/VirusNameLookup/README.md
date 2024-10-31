# Virus name lookup

## Populating the taxon_name table

### Importing ICTV Taxonomy data
- On the Windows dev server, run **exportToTSV.py** to call the **ExportTaxonomyNodes.sql** (MS-SQL) stored procedure and generate the *taxonomyNodes.tsv* file.
   ```
   py exportToTSV.py 
   --dbServer ICTVDEV 
   --ictvDB ICTVonline39 
   --table latest_taxonomy_nodes
   ```
- On the Linux server, run **importTaxonomyNodes.py** to read the TSV file and import data into the taxon_name table (MariaDB).
   ```
   py ./importTaxonomyNodes.py 
   --filename data/taxonomyNodes.tsv 
   --dbName virus_name_lookup 
   --host localhost 
   --username <username>
   --password <password> 
   --port 3306
   ```
       
### Importing VMR (species isolates) data
- On the Windows dev server, run **exportToTSV.py** to call the **ExportSpeciesIsolates.sql** (MS-SQL) stored procedure and generate the *speciesIsolates.tsv* file.
   ```
   py exportToTSV.py 
   --dbServer ICTVDEV 
   --ictvDB ICTVonline39 
   --table species_isolates
   ```
- On the Linux server, run **importSpeciesIsolates.py** to read the TSV file and import data into the taxon_name table (MariaDB).
   ```
   py ./importSpeciesIsolates.py 
   --filename data/speciesIsolates.tsv 
   --dbName virus_name_lookup 
   --host localhost 
   --username <username>
   --password <password> 
   --port 3306
   ```

### Importing NCBI Taxonomy
- TODO: download the NCBI dump files and use them to populate the **ncbi_names**, **ncbi_nodes**, and **division** tables.
- On the Linux server, run the stored procedure **PopulateTaxonNameFromNCBI.sql** and call it.
   ```
   CALL populateTaxonNameFromNCBI();
   ```
- Update subspecies taxa by finding their lowest level taxonomy node (preferably species) and try to match it to an ICTV taxon.
   - On the Windows dev server, populate the **subspecies_lookup** table by running and executing **LookupNcbiSubspecies.sql**.
   - On the Windows dev server, run the **GenerateSubspeciesLookupQueries.sql** query to export the contents of the **subspecies_lookup** table as UPDATE queries. Save the results in a file (make sure SQL Server is configured to allow up to 1000 characters per column).
   - Edit the file as follows:
      - Remove any unnecessary text at the beginning and end of the series of UPDATE queries. 
      - Lookup the term ID for "taxonomy_db.ncbi_taxonomy" and then replace every instance of @ncbiTaxDbTID in the file with the term ID.
   - FTP to modified file to the Linux server, start MySQL on the command line.
      ```
      mysql -u admin -p ictv_apps
      ```
   - Run the UPDATE queries in the file on the command line:
      ```
      source <filename>;
      ```

### ~~Populating the Taxon Histogram table~~

- ~~A **taxon_histogram** record contains metadata for a single taxon_name record, including:~~
  - ~~A column for every alphanumeric character (and space) that maintains the number of occurrences of that character in the taxon name.~~
  - ~~A "first letter" column with the taxon name's first character.~~
  - ~~A "text length" column with the taxon name's length.~~
- ~~Run **PopulateTaxonHistogram.sql** in the virus_name_lookup (MariaDB) database to call **CreateTaxonHistogram.sql** for every entry in the taxon_name table.~~

## Searching for taxon name matches

- Call the stored procedure **SearchTaxonName.sql** to search the taxon_name table for user-provided text. This stored procedure has the following parameters:
  - **maxResultCount**: The maximum number of results to return.
  - **searchText**: The taxon_name table is being searched for this text.
- The results from **SearchTaxonName** are ordered as follows:

| Column | sort | data type | description |
| Taxon name version ID | desc | int | Results with more recent versions are prefered | 
  - first_character_match (desc)
  - totalCountDiff (asc)
  - length_within_range (desc)
  - length_diff (asc)