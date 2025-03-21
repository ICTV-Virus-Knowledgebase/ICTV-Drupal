
DROP PROCEDURE IF EXISTS `UpdateVocabularyAndTerms`;

DELIMITER //

CREATE PROCEDURE `UpdateVocabularyAndTerms`()
   MODIFIES SQL DATA
BEGIN

   DECLARE vocabID INT;


   -- Updates for Sequence Classification in late February 2025.

   -- Get the job_status vocabulary
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'job_status');
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for job_status';
   END IF;

   -- Add the job_status "complete" if it doesn't already exist.
   IF NOT EXISTS (SELECT 1 FROM term WHERE term_key = 'complete' AND vocab_id = vocabID) THEN
      INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('job_status.complete', 'complete', 'complete', vocabID);
   END IF;


   /* 
   Updates from early February 2025

   -- Get the name_class vocabulary
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for name_class';
   END IF;

   -- Add the name_class "disease" if it doesn't already exist.
   IF NOT EXISTS (SELECT 1 FROM term WHERE term_key = 'disease' AND vocab_id = vocabID) THEN
      INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('name_class.disease', 'disease', 'disease', vocabID);
   END IF;
   

   -- Get the taxonomy_db vocabulary
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_db' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for taxonomy_db';
   END IF;

   -- Add the Disease Ontology taxonomy DB if it doesn't already exist.
   IF NOT EXISTS (SELECT 1 FROM term WHERE term_key = 'disease_ontology' AND vocab_id = vocabID) THEN
      INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.disease_ontology', 'Disease Ontology', 'disease_ontology', vocabID);
   END IF;

   -- Add the ICTV Curation taxonomy DB if it doesn't already exist.
   IF NOT EXISTS (SELECT 1 FROM term WHERE term_key = 'ictv_curation' AND vocab_id = vocabID) THEN
      INSERT INTO term (`full_key`, `label`, `term_key`, `vocab_id`) VALUES ('taxonomy_db.ictv_curation', 'ICTV Curation', 'ictv_curation', vocabID);
   END IF;

   */
	
END//
DELIMITER ;