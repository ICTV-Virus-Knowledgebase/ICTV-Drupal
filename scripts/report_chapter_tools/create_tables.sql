
CREATE TABLE report_chapter_node (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `html` longtext NOT NULL,
   `imported_on` datetime DEFAULT current_timestamp(),
   `node_id` int(11) NOT NULL,
   `path_alias` varchar(200) NOT NULL,
   `taxon_name` varchar(100) DEFAULT NULL,
   `taxnode_id` int(11) DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE report_chapter_section (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `depth` int(11) NOT NULL,
   `display_order` int(11) NOT NULL,
   `heading` varchar(500) DEFAULT NULL,
   `html` longtext DEFAULT NULL,
   `parent_section_id` int(11) DEFAULT NULL,
   `rc_node_id` int(11) NOT NULL,
   PRIMARY KEY (id),
   KEY `idx_rc_section_parent` (`parent_section_id`),
   KEY `idx_rc_section_node` (`rc_node_id`),
   CONSTRAINT `fk_rc_section_node` FOREIGN KEY (`rc_node_id`) REFERENCES `report_chapter_node` (`id`),
   CONSTRAINT `fk_rc_section_parent` FOREIGN KEY (`parent_section_id`) REFERENCES `report_chapter_section` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
