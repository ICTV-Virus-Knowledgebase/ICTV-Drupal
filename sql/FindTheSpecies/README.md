# Populating the ictv_apps database for "Find the Species"

## Setup the conda environment
- What's already there?
   - `conda env list`

- If it doesn't exist, create a conda environment "fts_env":
   - `conda create -n fts_env python=3.12.3`
   - `conda install pandas`
   - `conda install requests`
   - `conda install conda-forge::mariadb`

- To initialize and activate the conda environment:
   - `conda init`
   - `conda activate fts_env`

## Update NCBI Taxonomy
Run the automation script **update_ncbi_taxonomy_in_temp.sh** to download the latest
version of NCBI Taxonomy (as a zip file of text dump files) and import the data into the 
3 NCBI tables: ncbi_division, ncbi_node, and ncbi_name.

`./automation/update_ncbi_taxonomy_in_temp.sh -u <db user> -p <db password>`

## Update Disease Ontology
Run the automation script **update_disease_ontology_in_temp.sh** to import the file **diseaseOntologyData.csv**
into the disease_ontology table.

`./automation/update_disease_ontology_in_temp.sh -u <db user> -p <db password>`

## Populate ictv_apps_temp
Run the automation script **update_ictv_apps_temp.sh** to do the following: (TODO!)

`./automation/update_ictv_apps_temp.sh -u <db user> -p <db password>`

## Update ictv_apps from ictv_apps_temp
`./automation/update_ictv_apps.sh -u <db user> -p <db password>`