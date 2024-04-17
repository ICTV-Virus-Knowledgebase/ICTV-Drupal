

/*------------------------------------------------------------------------------
   After adding a "tid" column to the ncbi_division table, populate it 
   using the following query.
------------------------------------------------------------------------------*/
UPDATE division SET tid = (
	SELECT term.id
	FROM term
	WHERE term.vocab_id = 8
	AND [NAME] = term.label
);


/*------------------------------------------------------------------------------
   After adding a "name_class_tid" column to the ncbi_name table, populate it 
   using the following query.
------------------------------------------------------------------------------*/
UPDATE ncbi_name SET name_class_tid = (
	SELECT term.id
	FROM term
	WHERE term.vocab_id = 1
	AND name_class = term.label
);


/*------------------------------------------------------------------------------
   After adding a "rank_name_tid" column to the ncbi_node table, populate it 
   using the following query.
------------------------------------------------------------------------------*/
UPDATE ncbi_node SET rank_name_tid = (
	SELECT term.id
	FROM term
	WHERE term.vocab_id = 7
	AND rank_name = term.label
);


/*------------------------------------------------------------------------------
   New name classes for VMR.
------------------------------------------------------------------------------*/
insert into term (full_key, label, term_key, vocab_id) VALUES ('name_class.virus_name', 'Virus name', 'virus_name', 1);
insert into term (full_key, label, term_key, vocab_id) VALUES ('name_class.virus_name_abbreviation', 'Virus name abbreviation', 'virus_name_abbreviation', 1);
insert into term (full_key, label, term_key, vocab_id) VALUES ('name_class.virus_isolate_designation', 'Virus isolate designation', 'virus_isolate_designation', 1);