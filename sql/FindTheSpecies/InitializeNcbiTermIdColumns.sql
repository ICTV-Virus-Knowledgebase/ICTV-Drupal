
DROP PROCEDURE IF EXISTS `InitializeNcbiTermIdColumns`;

DELIMITER //

CREATE PROCEDURE `InitializeNcbiTermIdColumns`()
BEGIN

   DECLARE divisionCount INT;
   DECLARE divisionVocabID INT;
   DECLARE nameClassCount INT;
   DECLARE nameClassVocabID INT;
   DECLARE taxonomyRankCount INT;
   DECLARE taxonomyRankVocabID INT;

   -- ====================================================================================================
   -- NCBI Division
   -- ====================================================================================================

   -- Get and validate the ncbi_division vocabulary ID.
   SET divisionVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division' LIMIT 1);
   IF divisionVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for ncbi_division';
   END IF;

   -- Make sure there's at least one term for the ncbi_division vocabulary.
   SET divisionCount = (SELECT COUNT(*) FROM term WHERE vocab_id = divisionVocabID);
   IF divisionCount = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No terms found for ncbi_division vocabulary';
   END IF;


   -- ====================================================================================================
   -- Name Class
   -- ====================================================================================================

   -- Get and validate the name_class vocabulary ID.
   SET nameClassVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF nameClassVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for name_class';
   END IF;

   -- Make sure there's at least one term for the name_class vocabulary.
   SET nameClassCount = (SELECT COUNT(*) FROM term WHERE vocab_id = nameClassVocabID);
   IF nameClassCount = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No terms found for name_class vocabulary';
   END IF;


   -- ====================================================================================================
   -- Taxonomy Rank
   -- ====================================================================================================

   -- Get and validate the taxonomy_rank vocabulary ID.
   SET taxonomyRankVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_rank' LIMIT 1);
   IF taxonomyRankVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for taxonomy_rank';
   END IF;

   -- Make sure there's at least one term for the taxonomy_rank vocabulary.
   SET taxonomyRankCount = (SELECT COUNT(*) FROM term WHERE vocab_id = taxonomyRankVocabID);
   IF taxonomyRankCount = 0 THEN 
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No terms found for taxonomy_rank vocabulary';
   END IF;


   -- ====================================================================================================
   -- Make sure the NCBI Taxonomy tables have term ID columns.
   -- ====================================================================================================

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

END //
DELIMITER ;