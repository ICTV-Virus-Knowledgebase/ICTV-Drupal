
-- Disable foreign key checks for this session.
SET FOREIGN_KEY_CHECKS = 0;

LOAD DATA LOCAL INFILE './data/division.dmp' 
INTO TABLE ncbi_division 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '\t|\n'
(`id`, `cde`, `name`, `comments`); 

LOAD DATA LOCAL INFILE './data/nodes.dmp' 
INTO TABLE ncbi_node 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '\t|\n'
(`tax_id`,`parent_tax_id`,`rank_name`,`embl_code`,`division_id`,`inherited_div_flag`,`genetic_code_id`,`inherited_gc_flag`,
`mitochondrial_genetic_code_id`,`inherited_mgc_flag`,`genbank_hidden_flag`,`hidden_subtree_root_flag`,`comments`); 

LOAD DATA LOCAL INFILE './data/names.dmp' 
INTO TABLE ncbi_name 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '\t|\n'
(`tax_id`,`name_txt`,`unique_name`,`name_class`);


-- Trim the division names (just in case)
UPDATE ncbi_division SET name = TRIM(name);

-- Delete non-viral names from NCBI name.
DELETE FROM ncbi_name WHERE tax_id IN (

   -- Get the taxonomy IDs of nodes that aren't in a viral division.
	SELECT tax_id FROM ncbi_node WHERE division_id NOT IN (
      -- Get the IDs of viral divisions.
		SELECT id FROM ncbi_division WHERE name IN ('Phages', 'Synthetic and Chimeric', 'Unassigned', 'Viruses', 'Environmental samples')
	)
);

-- Delete non-viral names from NCBI node.
DELETE FROM ncbi_node WHERE division_id NOT IN (
   -- Get the IDs of viral divisions.
	SELECT id FROM ncbi_division WHERE name IN ('Phages', 'Synthetic and Chimeric', 'Unassigned', 'Viruses', 'Environmental samples')
);

-- Trim the names and rank names.
UPDATE ncbi_name SET name_txt = TRIM(name_txt), name_class = TRIM(name_class);
UPDATE ncbi_node SET rank_name = TRIM(rank_name);

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS = 1;
