
DROP PROCEDURE IF EXISTS `initializeNcbiTermIdColumns`;

DELIMITER //

CREATE PROCEDURE `initializeNcbiTermIdColumns`()
BEGIN

   DECLARE divisionVocabID INT;
   DECLARE nameClassVocabID INT;
   DECLARE taxonomyRankVocabID INT;


   -- Get and validate the ncbi_division vocabulary ID.
   SET divisionVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division' LIMIT 1);
   IF divisionVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for ncbi_division';
   END IF;

   -- Get and validate the name_class vocabulary ID.
   SET nameClassVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF nameClassVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for name_class';
   END IF;

   -- Get and validate the taxonomy_rank vocabulary ID.
   SET taxonomyRankVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_rank' LIMIT 1);
   IF taxonomyRankVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for taxonomy_rank';
   END IF;


   -- Make sure the ncbi_division table has a "tid" column, then populate it using the following query.
   UPDATE ncbi_division n
   JOIN term t ON t.label = n.name
	SET n.tid = t.id
	WHERE t.vocab_id = divisionVocabID;


   -- Make sure the ncbi_name table has a "name_class_tid" column, then populate it using the following query.
   UPDATE ncbi_name n
   JOIN term t ON t.label = n.name_class
   SET n.name_class_tid = t.id
   WHERE t.vocab_id = nameClassVocabID;


   -- Make sure the ncbi_node table has a "rank_name_tid" column , then populate it using the following query.
   UPDATE ncbi_node n
	JOIN term t ON t.label = n.rank_name
	SET n.rank_name_tid = t.id
	WHERE t.vocab_id = taxonomyRankVocabID;

END//
DELIMITER ;