
DROP PROCEDURE IF EXISTS `ImportIctvSpeciesEpithets`;

DELIMITER //

-- Import ICTV species with binomial nomenclature and remove the genus name from the species name.
CREATE PROCEDURE ImportIctvSpeciesEpithets()
BEGIN

   DECLARE ictvEpithetsTID INT;


   -- Lookup the term ID for the ICTV epithets "taxonomy database".
   SET ictvEpithetsTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ictv_epithets' LIMIT 1);
   IF ictvEpithetsTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for taxonomy_db.ictv_epithets';
   END IF;


   -- Create the new searchable_taxon records.
	INSERT INTO searchable_taxon (
		division_tid,
		filtered_name,
      ictv_id,
      ictv_taxnode_id,
      intermediate_name,
      intermediate_rank,
		`name`,
		name_class_tid,
		parent_taxonomy_db_tid,
		parent_taxonomy_id,
		rank_name_tid,
		taxonomy_db_tid,
		taxonomy_id,
		version_id
	)

   SELECT
      division_tid,
      filtered_epithet,
      ictv_id,
      ictv_taxnode_id,
      speciesName,
      "species",
      epithet,
      name_class_tid,
      parent_taxonomy_db_tid,
      parent_taxonomy_id,
      rank_name_tid,
      ictvEpithetsTID,
      taxonomy_id,
      version_id

      FROM (
         SELECT
            species.division_tid,

            -- Remove the genus name from the species name.
            trim(right(species.name, length(species.name) - length(genus.name) - 1)) AS epithet,

            -- Remove the filtered genus name from the filtered species name.
            trim(right(species.filtered_name, length(species.filtered_name) - length(genus.filtered_name) - 1)) AS filtered_epithet,
            
            species.ictv_id,
            species.ictv_taxnode_id,

            -- If the genus name is included in the species name, the species is using binomial nomenclature.
            CASE 
               WHEN locate(concat(genus.filtered_name, ' '), species.filtered_name) = 1 THEN 1 ELSE 0 
            END AS is_binomial, 

            species.name_class_tid,
            species.parent_taxonomy_db_tid,
            species.parent_taxonomy_id,
            species.rank_name_tid,
            species.name AS speciesName,
            species.taxonomy_db_tid,
            species.taxonomy_id,
            species.version_id

         FROM v_searchable_taxon species
         JOIN v_searchable_taxon genus ON genus.taxonomy_id = species.parent_taxonomy_id
         WHERE species.rank_name = 'species'
         AND genus.rank_name = 'genus'
         AND species.taxonomy_db = 'ictv_taxonomy'
         AND genus.taxonomy_db = 'ictv_taxonomy'
      ) binomials
      WHERE is_binomial = 1;

END //

DELIMITER ;
