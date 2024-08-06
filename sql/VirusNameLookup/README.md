# Virus name lookup

## Importing Taxonomy and VMR data 

### Importing Taxonomy data
- Run **exportToCSV.py** to call the **ExportTaxonomyNodes.sql** (MS-SQL) stored procedure and generate the *taxonomyNodes_\<timestamp\>.csv* file.
   ```
   py exportToCSV.py 
   --dbServer ICTVDEV 
   --ictvDB ICTVonline39 
   --table taxonomy_node
   ```
- Run **importTaxonomyNodes.py** to read the CSV file and import data into the taxon_name table (MariaDB).
   ```
   py ./importTaxonomyNodes.py 
   --filename data/taxonomyNodes_<timestamp>.csv 
   --dbName virus_name_lookup 
   --host localhost 
   --username <username>
   --password <password> 
   --port 3306
   ```
       
### Importing VMR (species isolates) data
- Run **exportToCSV.py** to call the **ExportSpeciesIsolates.sql** (MS-SQL) stored procedure and generate the *speciesIsolates_\<timestamp\>.csv* file.
   ```
   py exportToCSV.py 
   --dbServer ICTVDEV 
   --ictvDB ICTVonline39 
   --table species_isolates
   ```
- Run **importSpeciesIsolates.py** to read the CSV file and import data into the taxon_name table (MariaDB).
   ```
   py ./importSpeciesIsolates.py 
   --filename data/speciesIsolates_<timestamp>.csv 
   --dbName virus_name_lookup 
   --host localhost 
   --username <username>
   --password <password> 
   --port 3306
   ```

### Populating the Taxon Histogram table

- A **taxon_histogram** record contains metadata for a single taxon_name record, including:
  - A column for every alphanumeric character (and space) that maintains the number of occurrences of that character in the taxon name.
  - A "first letter" column with the taxon name's first character.
  - A "text length" column with the taxon name's length.
- Run **PopulateTaxonHistogram.sql** in the virus_name_lookup (MariaDB) database to call **CreateTaxonHistogram.sql** for every entry in the taxon_name table.

## Searching for taxon name matches

- Call the stored procedure **SearchTaxonHistogram.sql** to search the taxon_name table for matching taxa names. This stored procedure has the following parameters:
  - **countThreshold**: This value determines the range of column counts that will be considered when comparing the search text to a taxon_histogram. For example, if the search text has 4 **a**'s and the countThreshold is 2, only taxon_histogram records with an **a** count between 2 and 6 will be considered.
  - **maxCountDiffs**: For each taxon_histogram record that is searched, the absolute value of the difference between the search text count and taxon_histogram count for each column is added together to calculate the total count diffs. Only the taxon_histograms with a total count diff less than or equal to **maxCountDiffs** will be considered.
  - **maxLengthDiff**: 
  - **maxResultCount**: The maximum number of results to return.
  - **searchText**: The taxon_name table is being searched for this text.
- The results from **SearchTaxonHistogram** are ordered as follows:

| Column | sort | data type | description |
| Taxon name version ID | desc | int | Results with more recent versions are prefered | 
  - first_character_match (desc)
  - totalCountDiff (asc)
  - length_within_range (desc)
  - length_diff (asc)