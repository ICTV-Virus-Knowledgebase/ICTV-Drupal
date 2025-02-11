
DELIMITER //

DROP PROCEDURE IF EXISTS `InitializeCuratedNameVocabularyAndTerms`;

CREATE PROCEDURE `InitializeCuratedNameVocabularyAndTerms`()
   MODIFIES SQL DATA
BEGIN

   DECLARE vocabID INT;

   /*
   The curated_name_type vocabulary
   */
   INSERT INTO `vocabulary` (label, vocab_key)
   SELECT 'curated name type', 'curated_name_type'
   WHERE NOT EXISTS (
      SELECT 1
      FROM vocabulary
      WHERE vocab_key = 'curated_name_type'
   )
   
   SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'curated_name_type' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for curated_name_type';
   END IF;

   /*
   INSERT INTO `term` (
      full_key,
      label,
      term_key,
      vocab_id
   ) VALUES (
      'curated_name_type.disease',
      'disease',
      'disease',
      vocabID
   )

   INSERT INTO `term` (
      full_key,
      label,
      term_key,
      vocab_id
   ) VALUES (
      'curated_name_type.other',
      'other',
      'other',
      vocabID
   )
   */

   -- Get the "taxonomy_db" vocabulary's ID.
	SET vocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_db' LIMIT 1);
   IF vocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid vocabulary ID for taxonomy_db';
   END IF;

   /*
   INSERT INTO `term` (
      full_key,
      label,
      term_key,
      vocab_id
   ) VALUES (
      'taxonomy_db.ictv_curation',
      'ictv_curation',
      'ICTV curation',
      vocabID
   );
   */

END//
DELIMITER ;
