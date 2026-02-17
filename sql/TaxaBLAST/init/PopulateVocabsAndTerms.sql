
DELIMITER //

DROP PROCEDURE IF EXISTS `populateVocabsAndTerms`;

CREATE PROCEDURE `populateVocabsAndTerms` ()
BEGIN

	-- Declare variables used below.
   DECLARE vocabID INT;

   -- Job status
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'job_status');
   IF vocabID IS NULL THEN
      INSERT IGNORE INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'job status', 'job_status');
      SET vocabID = (SELECT LAST_INSERT_ID());
   END IF;

   -- Add job status terms
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.complete', 'complete', 'complete', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.crashed', 'crashed', 'crashed', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.error', 'error', 'error', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.invalid', 'invalid', 'invalid', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.pending', 'pending', 'pending', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_status.valid', 'valid', 'valid', vocabID);

   
   -- Job type
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'job_type');
   IF vocabID IS NULL THEN  
      INSERT INTO `vocabulary` (`description`, `label`, `vocab_key`) VALUES (NULL, 'job type', 'job_type');
      SET vocabID = (SELECT LAST_INSERT_ID()); 
   END IF;

   -- INSERT INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_type.proposal_validation', 'proposal validation', 'proposal_validation', vocabID);
   INSERT IGNORE INTO `term` (`description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES (NULL, 'job_type.sequence_search', 'sequence search', 'sequence_search', vocabID);
   
END //

DELIMITER ;