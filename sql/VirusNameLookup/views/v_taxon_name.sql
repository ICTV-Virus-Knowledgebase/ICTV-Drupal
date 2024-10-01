
CREATE OR REPLACE VIEW `v_taxon_name` AS 

SELECT 

	tn.id,
	divTerm.term_key AS division,
	tn.division_tid,
	tn.filtered_name,
	tn.ictv_taxnode_id,
	tn.is_valid,
	tn.name,
	nameClass.term_key AS name_class,
	tn.name_class_tid,
	parentTaxDB.term_key AS parent_taxonomy_db,
	tn.parent_taxonomy_id,
	tn.rank_name,
	tn.rank_name_tid,
	taxDB.term_key AS taxonomy_db,
	tn.taxonomy_db_tid,
	tn.taxonomy_id,
	tn.version_id,
	tn.created_on

FROM taxon_name tn
JOIN term divTerm ON divTerm.id = tn.division_tid
JOIN term nameClass ON nameClass.id = tn.name_class_tid
LEFT JOIN term parentTaxDB ON parentTaxDB.id = tn.parent_taxonomy_db_tid
JOIN term rankName ON rankName.id = tn.rank_name_tid
JOIN term taxDB ON taxDB.id = tn.taxonomy_db_tid  ;