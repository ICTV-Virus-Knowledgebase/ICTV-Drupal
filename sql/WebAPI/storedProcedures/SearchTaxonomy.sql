
DROP PROCEDURE IF EXISTS `SearchTaxonomy`;

DELIMITER //

CREATE PROCEDURE SearchTaxonomy(
   IN currentRelease INT,
   IN includeAllReleases INT,
   IN searchText VARCHAR(100),
   IN selectedRelease INT
)
BEGIN
   DECLARE filteredSearchText VARCHAR(100);

   -- Validate the current MSL release
   IF currentRelease IS NULL OR currentRelease < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please enter a valid current MSL release';
   END IF;

   -- Validate the search text
   SET searchText = TRIM(searchText);
   IF searchText IS NULL OR LENGTH(searchText) < 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please enter non-empty search text';
   END IF;

   -- Replace the same characters that were replaced in the cleaned_name column.
   SET filteredSearchText = searchText;
   -- REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(searchText, 'í', 'i'), 'é', 'e'), 'ó', 'o'), 'ú', 'u'), 'á', 'a'), 'ì', 'i'), 'è', 'e'), 'ò', 'o'), 'ù', 'u'), 'à', 'a'), 'î', 'i'), 'ê', 'e'), 'ô', 'o'), 'û', 'u'), 'â', 'a'), 'ü', 'u'), 'ö', 'o'), 'ï', 'i'), 'ë', 'e'), 'ä', 'a'), 'ç', 'c'), 'ñ', 'n'), '‘', ''''), '’', ''''), '`', ' '), '  ', ' ');

   -- Make sure "include all releases" isn't null.
   IF includeAllReleases IS NULL THEN
      SET includeAllReleases = 0;
   END IF;

   -- If we aren't including all releases and the MSL release number is null, default to the current release.
   IF includeAllReleases = 0 AND selectedRelease IS NULL THEN
      SET selectedRelease = currentRelease;
   END IF;

   -- Search the taxonomy_node table
   SELECT
      (SELECT 1 as display_order
       /*FROM (
          SELECT
             DENSE_RANK() OVER (ORDER BY siblingTN.left_idx ASC) AS display_order,
             siblingTN.taxnode_id
          FROM taxonomy_node siblingTN
          WHERE siblingTN.parent_id = tn.parent_id
          AND siblingTN.level_id = tn.level_id
          AND siblingTN.taxnode_id <> siblingTN.tree_id
       ) sortedSiblings
       WHERE sortedSiblings.taxnode_id = tn.taxnode_id */
      ) AS display_order,
      tn.ictv_id AS ictv_id,
      REPLACE(IFNULL(tn.lineage, ''), ';', '>') AS lineage,
      tn.name AS name,
      tn.parent_id AS parent_taxnode_id,
      tl.name AS rank_name,
      tn.msl_release_num AS release_number,
      searchText AS search_text,
      tn.taxnode_id AS taxnode_id,
      CONCAT_WS(',', tn.tree_id,
         IFNULL(tn.realm_id, ''),
         IFNULL(tn.subrealm_id, ''),
         IFNULL(tn.kingdom_id, ''),
         IFNULL(tn.subkingdom_id, ''),
         IFNULL(tn.phylum_id, ''),
         IFNULL(tn.subphylum_id, ''),
         IFNULL(tn.class_id, ''),
         IFNULL(tn.subclass_id, ''),
         IFNULL(tn.order_id, ''),
         IFNULL(tn.suborder_id, ''),
         IFNULL(tn.family_id, ''),
         IFNULL(tn.subfamily_id, ''),
         IFNULL(tn.genus_id, ''),
         IFNULL(tn.subgenus_id, ''),
         IFNULL(tn.species_id, '')
      ) AS taxnode_lineage,
      tn.tree_id AS tree_id,
      tree.name AS tree_name
   FROM taxonomy_node tn
   JOIN taxonomy_level tl ON tl.id = tn.level_id
   JOIN taxonomy_node tree ON tree.taxnode_id = tn.tree_id AND tree.msl_release_num IS NOT NULL
   WHERE tn.cleaned_name LIKE CONCAT('%', filteredSearchText, '%')
   AND tn.is_hidden = 0
   AND tn.is_deleted = 0
   AND (includeAllReleases = 1 OR tn.msl_release_num = selectedRelease)
   AND tn.msl_release_num <= currentRelease
   ORDER BY tn.tree_id DESC, tn.left_idx;

END //

DELIMITER ;