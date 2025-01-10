
DROP PROCEDURE IF EXISTS `ImportLatestTaxonomyNodes`;

DELIMITER //

-- Import information from the latest taxonomy_node corresponding with distinct names in taxonomy_node. 

-- Updates
-- 01/09/25: Now excluding hidden and deleted taxonomy_node records.
 
CREATE PROCEDURE ImportLatestTaxonomyNodes()
BEGIN

   DECLARE delimitedName VARCHAR(300);
   DECLARE division VARCHAR(20);
   DECLARE done INT DEFAULT FALSE;
   DECLARE errorMessage VARCHAR(200);
   DECLARE ictvID INT(11);
   DECLARE ictvTaxonomyDB VARCHAR(20);
   DECLARE mslRelease INT(11);
   DECLARE name VARCHAR(300);
   DECLARE name_end INT;
   DECLARE name_pos INT DEFAULT 1;
   DECLARE parentID INT(11);
   DECLARE rankName VARCHAR(20);
   DECLARE taxnodeID INT(11); 

   -- NOTE: Make sure the views v_species_isolates, v_taxonomy_level, and v_taxonomy_node have been 
   -- updated with the name of the current ICTVonline* database!

   -- A cursor to fetch taxonomy data for the latest version of each distinct name.
   DECLARE cur CURSOR FOR 
   
      SELECT
         CASE 
            WHEN tn.host_source LIKE '%bacteria%' OR tn.host_source LIKE '%archaea%' THEN 'phages' ELSE 'viruses'
         END AS division,
         tn.ictv_id,
         tn.msl_release_num,
         tn.name,
         tn.parent_id,
         tl.name AS rank_name,
         tn.taxnode_id 
      FROM (
         SELECT 
            distinct_name,
            (
               SELECT latest_tn.taxnode_id
               FROM v_taxonomy_node latest_tn
               WHERE latest_tn.name = distinct_name
               AND latest_tn.is_hidden = 0
               AND latest_tn.is_deleted = 0
               ORDER BY latest_tn.msl_release_num DESC
               LIMIT 1
            ) AS taxnode_id
         FROM (
            SELECT DISTINCT distinct_tn.name AS distinct_name
            FROM v_taxonomy_node distinct_tn
            WHERE distinct_tn.is_hidden = 0
            AND distinct_tn.is_deleted = 0
         ) distinctNames
      ) latest
      JOIN v_taxonomy_node tn ON tn.taxnode_id = latest.taxnode_id
      JOIN v_taxonomy_level tl ON tl.id = tn.level_id
      WHERE tn.msl_release_num IS NOT NULL
      AND tn.is_hidden = 0
      AND tn.is_deleted = 0
      AND tn.taxnode_id <> tn.tree_id;

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN cur;

   -- Set constant values
   SET ictvTaxonomyDB = 'ictv_taxonomy';

   read_loop: LOOP

      FETCH cur INTO division, ictvID, mslRelease, name, parentID, rankName, taxnodeID;

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
      CALL importSearchableTaxon(division, ictvID, taxnodeID, NULL, NULL, name, 'taxon_name', ictvTaxonomyDB, parentID, 
         rankName, ictvTaxonomyDB, taxnodeID, mslRelease);

   END LOOP;

   CLOSE cur;
END //

DELIMITER ;
