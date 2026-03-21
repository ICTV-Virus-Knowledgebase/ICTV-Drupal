
DELIMITER //

DROP PROCEDURE IF EXISTS `InitializeTempVocabularyAndTerm`;

CREATE PROCEDURE `InitializeTempVocabularyAndTerm`()
   MODIFIES SQL DATA
BEGIN

   -- Disable foreign key checks for this session.
   SET FOREIGN_KEY_CHECKS = 0;

   -- Delete records from the ictv_apps_temp vocabulary table.
   DELETE FROM ictv_apps_temp.vocabulary;
   
   -- Copy the vocabulary table from ictv_apps to ictv_apps_temp.
   /* INSERT INTO ictv_apps_temp.vocabulary (
      id, 
      description, 
      label, 
      vocab_key
   )
   SELECT 
      id,
      description,
      label,
      vocab_key
   FROM ictv_apps.vocabulary; */


   -- Delete records from the ictv_apps_temp term table.
   DELETE FROM ictv_apps_temp.term;
   
   -- Copy the term table from ictv_apps to ictv_apps_temp.
   /* INSERT INTO ictv_apps_temp.term (
      id, 
      description,
      full_key,
      label, 
      term_key, 
      vocab_id
   )
   SELECT 
      id,
      description,
      full_key,
      label,
      term_key,
      vocab_id
   FROM ictv_apps.term; */

   -- Re-enable foreign key checks.
   SET FOREIGN_KEY_CHECKS = 1;

END//
DELIMITER ;