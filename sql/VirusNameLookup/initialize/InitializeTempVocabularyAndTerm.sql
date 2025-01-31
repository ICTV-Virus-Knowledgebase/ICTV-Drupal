
DELIMITER //

DROP PROCEDURE IF EXISTS `InitializeTempVocabularyAndTerm`;

CREATE PROCEDURE `InitializeTempVocabularyAndTerm`()
   MODIFIES SQL DATA
BEGIN

   -- Delete records from the ictv_apps_temp vocabulary table.
   DELETE FROM ictv_apps_temp.vocabulary;

   -- Copy the vocabulary table from ictv_apps to ictv_apps_temp.
   INSERT INTO ictv_apps_temp.vocabulary (
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
   FROM ictv_apps.vocabulary;


   -- Delete records from the ictv_apps_temp term table.
   DELETE FROM ictv_apps_temp.term;
   
   -- Copy the term table from ictv_apps to ictv_apps_temp.
   INSERT INTO ictv_apps_temp.term (
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
   FROM ictv_apps.term;

END//
DELIMITER ;