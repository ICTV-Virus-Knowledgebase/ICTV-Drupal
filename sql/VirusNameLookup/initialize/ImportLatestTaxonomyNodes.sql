
DROP PROCEDURE IF EXISTS `ImportLatestTaxonomyNodes`;

DELIMITER //

-- Import information from the latest taxonomy_node corresponding with distinct names in taxonomy_node. 
CREATE PROCEDURE ImportLatestTaxonomyNodes()
BEGIN

   DECLARE abbreviations LONGTEXT;
   DECLARE delimitedName VARCHAR(300);
   DECLARE division VARCHAR(20);
   DECLARE done INT DEFAULT FALSE;
   DECLARE errorMessage VARCHAR(200);
   DECLARE exemplarName LONGTEXT;
   DECLARE genbankAccessions LONGTEXT;
   DECLARE ictvID INT(11);
   DECLARE ictvTaxonomyDB VARCHAR(20);
   DECLARE isolateNames LONGTEXT;
   DECLARE mslRelease INT(11);
   DECLARE name VARCHAR(300);
   DECLARE name_end INT;
   DECLARE name_pos INT DEFAULT 1;
   DECLARE parentID INT(11);
   DECLARE rankName VARCHAR(20);
   DECLARE refseqAccessions LONGTEXT;
   DECLARE taxnodeID INT(11); 

   -- NOTE: Make sure the views v_species_isolates, v_taxonomy_level, and v_taxonomy_node have been 
   -- updated with the name of the current ICTVonline* database!

   -- A cursor to fetch taxonomy data for the latest version of each distinct name.
   DECLARE cur CURSOR FOR 
   
      SELECT
         tn.abbrev_csv,
         CASE 
            WHEN tn.host_source LIKE '%bacteria%' OR tn.host_source LIKE '%archaea%' THEN 'phages' ELSE 'viruses'
         END AS division,
         tn.exemplar_name,
         tn.genbank_accession_csv,
         tn.ictv_id,
         tn.isolate_csv,
         tn.msl_release_num,
         tn.name,
         tn.parent_id,
         tl.name AS rank_name,
         tn.refseq_accession_csv,
         tn.taxnode_id 
      FROM (
         SELECT 
            distinct_name,
            (
               SELECT latest_tn.taxnode_id
               FROM v_taxonomy_node latest_tn
               WHERE latest_tn.name = distinct_name
               ORDER BY latest_tn.msl_release_num DESC
               LIMIT 1
            ) AS taxnode_id
         FROM (
            SELECT DISTINCT distinct_tn.name AS distinct_name
            FROM v_taxonomy_node distinct_tn
         ) distinctNames
      ) latest
      JOIN v_taxonomy_node tn ON tn.taxnode_id = latest.taxnode_id
      JOIN v_taxonomy_level tl ON tl.id = tn.level_id
      WHERE tn.msl_release_num IS NOT NULL
      AND tn.taxnode_id <> tn.tree_id;

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN cur;

   -- Set constant values
   SET ictvTaxonomyDB = 'ictv_taxonomy';

   read_loop: LOOP

      FETCH cur INTO abbreviations, division, exemplarName, genbankAccessions, ictvID, isolateNames, 
         mslRelease, name, parentID, rankName, refseqAccessions, taxnodeID;

      IF done THEN
         LEAVE read_loop;
      END IF;

      -- Validate the taxnodeID (required).
      IF taxnodeID IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxnodeID';
      END IF;

      -- Validate the MSL release number (required).
      IF mslRelease IS NULL THEN
         SET errorMessage = CONCAT('MSL release number is invalid for taxnode_id ', taxnodeID);
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = errorMessage;
      END IF;

      -- Validate the rank name (required).
      SET rankName = TRIM(rankName);
      IF rankName IS NULL OR LENGTH(rankName) < 1 THEN
         SET errorMessage = CONCAT('Rank name is invalid for taxnode_id ', taxnodeID);
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = errorMessage;
      END IF;

      IF division IS NULL OR LENGTH(division) < 1 THEN
         SET division = "viruses";
      END IF;
      
      -- Validate the name (required).
      SET name = TRIM(name);
      IF name IS NULL OR LENGTH(name) < 1 THEN
         SET errorMessage = CONCAT('Name is invalid for taxnode_id ', taxnodeID);
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = errorMessage;
      END IF;

      -- Add the name
      CALL importSearchableTaxon(division, ictvID, taxnodeID, name, 'scientific_name', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);

      -- Are there any abbreviations?
      SET abbreviations = TRIM(REPLACE(abbreviations, ',', ';'));
      IF abbreviations IS NOT NULL AND LENGTH(abbreviations) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', abbreviations, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(abbreviations, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(abbreviations, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(division, ictvID, taxnodeID, delimitedName, 'abbreviation', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);
            END IF;
            
         END WHILE;
      END IF;

      -- Is there an exemplar name to add?
      SET exemplarName = TRIM(exemplarName);
      IF exemplarName IS NOT NULL AND LENGTH(exemplarName) > 0 THEN 
         CALL importSearchableTaxon(division, ictvID, taxnodeID, exemplarName, 'isolate_exemplar', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);
      END IF;

      -- Should we add any GenBank accessions?
      SET genbankAccessions = TRIM(REPLACE(genbankAccessions, ',', ';'));
      IF genbankAccessions IS NOT NULL AND LENGTH(genbankAccessions) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', genbankAccessions, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(genbankAccessions, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(genbankAccessions, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(division, ictvID, taxnodeID, delimitedName, 'genbank_accession', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);
            END IF;

         END WHILE;
      END IF;
      
      -- Should we add isolate names?
      SET isolateNames = TRIM(REPLACE(isolateNames, ',', ';'));
      IF isolateNames IS NOT NULL AND LENGTH(isolateNames) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', isolateNames, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(isolateNames, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(isolateNames, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(division, ictvID, taxnodeID, delimitedName, 'isolate_name', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);
            END IF;

         END WHILE;
      END IF;
      
      -- Should we add RefSeq accessions?
      SET refseqAccessions = REPLACE(refseqAccessions, ',', ';');
      IF refseqAccessions IS NOT NULL AND LENGTH(refseqAccessions) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', refseqAccessions, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(refseqAccessions, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(refseqAccessions, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(division, ictvID, taxnodeID, delimitedName, 'refseq_accession', ictvTaxonomyDB, parentID, rankName, ictvTaxonomyDB, taxnodeID, mslRelease);
            END IF;

         END WHILE;
      END IF;

   END LOOP;

   CLOSE cur;
END //

DELIMITER ;
