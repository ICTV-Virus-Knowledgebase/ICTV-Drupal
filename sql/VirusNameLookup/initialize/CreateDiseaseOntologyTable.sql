
CREATE TABLE `disease_ontology` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `definition` text DEFAULT NULL,
  `disease_name` varchar(300) NOT NULL,
  `doid` varchar(100) NOT NULL,
  `ictv_id` int(10) unsigned DEFAULT NULL,
  `ictv_taxnode_id` int(10) unsigned DEFAULT NULL,
  `imported_on` datetime DEFAULT current_timestamp(),
  `ncbi_name` varchar(300) DEFAULT NULL,
  `ncbi_taxid` int(10) unsigned DEFAULT NULL,
  `possible_name` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=323 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;