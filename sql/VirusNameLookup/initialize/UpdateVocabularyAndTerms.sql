
DELIMITER //

DROP PROCEDURE IF EXISTS `UpdateVocabularyAndTerms`;

CREATE PROCEDURE `UpdateVocabularyAndTerms`()
   MODIFIES SQL DATA
BEGIN


   DECLARE vocabID INT;

   /*
   The name_class vocabulary
   */
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for name_class';
   END IF;

   -- Insert the name_class "disease".
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.disease', 'disease', 'disease', vocabID);
   

   /*
   The taxonomy_db vocabulary
   */
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_db' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for taxonomy_db';
   END IF;

   -- Insert the new taxonomy DBs (Disease Ontology and ICTV Curation).
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.disease_ontology', 'Disease Ontology', 'disease_ontology', vocabID);
   INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.ictv_curation', 'ICTV Curation', 'ictv_curation', vocabID);
	
END//
DELIMITER ;