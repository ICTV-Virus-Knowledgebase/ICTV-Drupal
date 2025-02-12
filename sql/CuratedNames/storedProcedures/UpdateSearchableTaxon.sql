
DROP PROCEDURE IF EXISTS `UpdateSearchableTaxon`;


DELIMITER //

CREATE PROCEDURE UpdateSearchableTaxon(
   IN `curatedNameID` INT,
   IN `ictvTaxnodeID` INT,
   IN `name_` NVARCHAR(300),
   IN `type_` VARCHAR(100)
)
BEGIN

   DECLARE divisionTID INT;
   DECLARE filteredName VARCHAR(500);
   DECLARE ictvID INT;
   DECLARE ictvCurationTaxDbTID INT;
   DECLARE nameClassTID INT;
   DECLARE rankNameTID INT;
   DECLARE searchableTaxonID INT;
   

   -- ======================================================================================================================
   -- Validate input parameters
   -- ======================================================================================================================
   IF curatedNameID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid curated name ID parameter';
   END IF;

   IF ictvTaxnodeID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid ICTV taxnode ID parameter';
   END IF;

   SET name_ = TRIM(name_);
   IF name_ IS NULL OR LENGTH(name_) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name parameter';
   END IF;

   SET type_ = TRIM(type_);
   IF type_ IS NULL OR LENGTH(type_) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid type parameter';
   END IF;


   -- ======================================================================================================================
   -- Filter/clean the name parameter.
   -- ======================================================================================================================
   SET filteredName = getFilteredName(name_);

   -- ======================================================================================================================
   -- Lookup taxonomy_node values: divisionTID, ictvID, and rankNameTID.
   -- ======================================================================================================================
   SELECT
      ( 
         SELECT id FROM term WHERE full_key = CONCAT('ncbi_division.', (
            SELECT CASE 
               WHEN tn.host_source LIKE '%bacteria%' OR tn.host_source LIKE '%archaea%' THEN 'phages' ELSE 'viruses'
            END
         ))
      ) AS division_tid,
      tn.ictv_id,
      rankName.id AS rank_name_tid

      INTO divisionTID, ictvID, rankNameTID

   FROM v_taxonomy_node_names tn
   JOIN term rankName ON rankName.term_key = tn.rank_name 
   WHERE tn.taxnode_id = ictvTaxnodeID -- 202304771
   LIMIT 1;

   -- TODO: validate taxonomy_node values?


   -- ======================================================================================================================
   -- Lookup term IDs
   -- ======================================================================================================================
   SET ictvCurationTaxDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_curation' LIMIT 1);
   IF ictvCurationTaxDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid taxonomy db term ID for ictv_curation';
   END IF;

   SET nameClassTID = (SELECT id FROM term WHERE full_key = CONCAT('name_class.', type_) LIMIT 1);
   IF nameClassTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid name class term ID for curated name type';
   END IF;


   -- ======================================================================================================================
   -- Is there already a searchable_taxon record for this curated_name?
   -- ======================================================================================================================
   SELECT id INTO searchableTaxonID
   FROM v_searchable_taxon st
   WHERE st.taxonomy_db = 'ictv_curation'
   AND st.taxonomy_id = curatedNameID
   LIMIT 1;


   
   IF searchableTaxonID IS NULL THEN

      -- ======================================================================================================================
      -- The curated name hasn't been added to searchable_taxon.
      -- ======================================================================================================================
      INSERT INTO searchable_taxon (
         division_tid,
         filtered_name,
         ictv_id,
         ictv_taxnode_id,
         is_valid,
         `name`,
         name_class_tid,
         rank_name_tid,
         taxonomy_db_tid,
         taxonomy_id,
         version_id
      ) VALUES (
         divisionTID,
         filteredName,
         ictvID,
         ictvTaxnodeID,
         1, -- is_valid
         name_,
         nameClassTID,
         rankNameTID,
         ictvCurationTaxDbTID,
         curatedNameID,
         1
      );

   ELSE
      -- ======================================================================================================================
      -- The curated name has already been added to searchable_taxon.
      -- ======================================================================================================================
      UPDATE searchable_taxon st SET
         st.division_tid = divisionTID,
         st.filtered_name = filteredName,
         st.ictv_id = ictvID,
         st.ictv_taxnode_id = ictvTaxnodeID,
         st.is_valid = 1,
         st.name = name_,
         st.name_class_tid = nameClassTID,
         st.rank_name_tid = rankNameTID,
         st.taxonomy_db_tid = ictvCurationTaxDbTID,
         st.taxonomy_id = curatedNameID
      WHERE st.id = searchableTaxonID;

   END IF;

END//
DELIMITER ;
