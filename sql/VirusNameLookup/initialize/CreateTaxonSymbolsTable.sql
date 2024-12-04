
CREATE TABLE ictv_apps.taxon_symbols (
	a CHAR NOT NULL,
	b CHAR NOT NULL,
	searchable_taxon_id INTEGER UNSIGNED NOT NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;