
DROP PROCEDURE IF EXISTS `InitializeNcbiTermIdColumns`;

DELIMITER //

CREATE PROCEDURE `InitializeNcbiTermIdColumns`()
BEGIN

   DECLARE divisionVocabID INT;
   DECLARE nameClassCount INT;
   DECLARE nameClassVocabID INT;
   DECLARE taxonomyRankCount INT;
   DECLARE taxonomyRankVocabID INT;

   
   -- ====================================================================================================
   -- Get and validate vocabulary IDs
   -- ====================================================================================================

   -- NCBI Division
   SET divisionVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'ncbi_division' LIMIT 1);
   IF divisionVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for ncbi_division';
   END IF;

   -- Name class
   SET nameClassVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'name_class' LIMIT 1);
   IF nameClassVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for name_class';
   END IF;

   -- Taxonomy rank
   SET taxonomyRankVocabID = (SELECT id FROM vocabulary WHERE vocab_key = 'taxonomy_rank' LIMIT 1);
   IF taxonomyRankVocabID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vocabulary ID for taxonomy_rank';
   END IF;


   /* 
   ====================================================================================================
   Populate the following (custom) term ID columns in the NCBI Taxonomy tables: 

   1) ncbi_division.tid: A term ID for the division name.

   2) ncbi_name.name_class_tid: A term ID for the name class.

   3) ncbi_node.rank_name_tid: A term ID for the taxonomy rank.

   ==================================================================================================== 
   */

   -- ncbi_division.tid
   UPDATE ncbi_division n
   JOIN term t ON t.label = n.name
	SET n.tid = t.id
	WHERE t.vocab_id = divisionVocabID;

   -- ncbi_name.name_class_tid
   UPDATE ncbi_name n
   JOIN term t ON t.label = n.name_class
   SET n.name_class_tid = t.id
   WHERE t.vocab_id = nameClassVocabID;

   -- ncbi_node.rank_name_tid
   UPDATE ncbi_node n
	JOIN term t ON t.label = n.rank_name
	SET n.rank_name_tid = t.id
	WHERE t.vocab_id = taxonomyRankVocabID;

END //
DELIMITER ;