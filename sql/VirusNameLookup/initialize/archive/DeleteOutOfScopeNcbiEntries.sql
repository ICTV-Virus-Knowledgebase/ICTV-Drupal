

-- Delete NCBI names and nodes that are not Bacteria, Phages, Synthetic and Chimeric, Unassigned, 
-- Viruses, or Environmental samples.

SET FOREIGN_KEY_CHECKS = 0;

-- NCBI names
DELETE FROM ncbi_name WHERE tax_id IN (
	SELECT tax_id FROM ncbi_node WHERE division_id IN (
		SELECT id 
		FROM ncbi_division 
		WHERE NAME IN ('Invertebrates','Mammals','Plants and Fungi','Primates','Rodents','Vertebrates')
	)
);

-- NCBI nodes
DELETE FROM ncbi_node WHERE division_id IN (
   SELECT id 
   FROM ncbi_division 
   WHERE NAME IN ('Invertebrates','Mammals','Plants and Fungi','Primates','Rodents','Vertebrates')
);

SET FOREIGN_KEY_CHECKS = 1;