CREATE TABLE report_chapter_node (
    id INT NOT NULL AUTO_INCREMENT,
    html LONGTEXT NOT NULL,
    imported_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    node_id INT NOT NULL,
    path_alias VARCHAR(200) NOT NULL,
    taxon_name VARCHAR(100) NULL,
    taxnode_id INT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE report_chapter_section (
    id INT NOT NULL AUTO_INCREMENT,
    depth INT NOT NULL,
    display_order INT NOT NULL,
    heading VARCHAR(500) NULL,
    html LONGTEXT NULL,
    parent_section_id INT NULL,
    rc_node_id INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_rc_section_parent (parent_section_id),
    KEY idx_rc_section_node (rc_node_id),
    CONSTRAINT fk_rc_section_parent FOREIGN KEY (parent_section_id)
        REFERENCES report_chapter_section (id),
    CONSTRAINT fk_rc_section_node FOREIGN KEY (rc_node_id)
        REFERENCES report_chapter_node (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
