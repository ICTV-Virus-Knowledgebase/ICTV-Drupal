
-- Disable foreign key checks for this session.
SET FOREIGN_KEY_CHECKS = 0;

LOAD DATA LOCAL INFILE './data/division.dmp' 
INTO TABLE ncbi_division 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '|\n' -- TEST on 020826
(`id`, `cde`, `name`, `comments`); 

LOAD DATA LOCAL INFILE './data/nodes.dmp' 
INTO TABLE ncbi_node 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '|\n' -- TEST on 020826
(`tax_id`,`parent_tax_id`,`rank_name`,`embl_code`,`division_id`,`inherited_div_flag`,`genetic_code_id`,`inherited_gc_flag`,
`mitochondrial_genetic_code_id`,`inherited_mgc_flag`,`genbank_hidden_flag`,`hidden_subtree_root_flag`,`comments`); 

LOAD DATA LOCAL INFILE './data/names.dmp' 
INTO TABLE ncbi_name 
FIELDS TERMINATED BY '\t|\t' 
LINES TERMINATED BY '|\n' -- TEST on 020826
(`tax_id`,`name_txt`,`unique_name`,`name_class`);

-- Re-enable foreign key checks.
SET FOREIGN_KEY_CHECKS = 1;