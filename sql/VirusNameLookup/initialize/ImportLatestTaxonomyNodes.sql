
-- DROP PROCEDURE IF EXISTS `ImportLatestTaxonomyNodes`;

DELIMITER //

CREATE PROCEDURE ImportLatestTaxonomyNodes()
BEGIN
   DECLARE delimitedName VARCHAR(300);
   DECLARE done INT DEFAULT FALSE;
   
   DECLARE abbrev_csv LONGTEXT;
   DECLARE exemplar_name LONGTEXT;
   DECLARE genbank_accession_csv LONGTEXT;
   DECLARE ictvTaxonomyDB VARCHAR(20);
   DECLARE isolate_csv LONGTEXT;
   DECLARE msl_release_num INT(11);
   DECLARE name VARCHAR(300);
   DECLARE parent_id INT(11);
   DECLARE rank_name VARCHAR(20);
   DECLARE refseq_accession_csv LONGTEXT;
   DECLARE taxnode_id INT(11); 
   
   DECLARE name_pos INT DEFAULT 1;
   DECLARE name_end INT;

   -- A cursor to fetch taxonomy data for the latest version of each distinct name.
   DECLARE cur CURSOR FOR 
   
      SELECT
         tn.abbrev_csv,
         tn.exemplar_name,
         tn.genbank_accession_csv,
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
               FROM ICTVonline39.taxonomy_node latest_tn
               WHERE latest_tn.name = distinct_name
               ORDER BY latest_tn.msl_release_num DESC
               LIMIT 1
            ) AS taxnode_id
         FROM (
            SELECT DISTINCT distinct_tn.name AS distinct_name
            FROM ICTVonline39.taxonomy_node distinct_tn
         ) distinctNames
      ) latest
      JOIN ICTVonline39.taxonomy_node tn ON tn.taxnode_id = latest.taxnode_id
      JOIN ICTVonline39.taxonomy_level tl ON tl.id = tn.level_id
      WHERE tn.msl_release_num IS NOT NULL
      AND tn.taxnode_id <> tn.tree_id;

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN cur;

   -- Set constant values
   SET ictvTaxonomyDB = 'ictv_taxonomy';

   read_loop: LOOP

      FETCH cur INTO abbrev_csv, exemplar_name, genbank_accession_csv, isolate_csv, 
         msl_release_num, name, parent_id, rank_name, refseq_accession_csv, taxnode_id;

      IF done THEN
         LEAVE read_loop;
      END IF;

      -- Validate the MSL release number (required).
      IF msl_release_num IS NULL THEN
         LEAVE read_loop;
      END IF;

      -- Validate the rank name (required).
      SET rank_name = TRIM(rank_name);
      IF rank_name IS NULL OR LENGTH(rank_name) < 1 THEN
         LEAVE read_loop;
      END IF;

      -- Validate the taxnode_id (required).
      IF taxnode_id IS NULL THEN
         LEAVE read_loop;
      END IF;

      -- Validate the name (required).
      SET name = TRIM(name);
      IF name IS NULL OR LENGTH(name) < 1 THEN
         LEAVE read_loop;
      END IF;

      -- Add the name
      CALL importSearchableTaxon(name, 'scientific_name', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);

      -- Are there any abbreviations?
      SET abbrev_csv = TRIM(REPLACE(abbrev_csv, ',', ';'));
      IF abbrev_csv IS NOT NULL AND LENGTH(abbrev_csv) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', abbrev_csv, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(abbrev_csv, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(abbrev_csv, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(delimitedName, 'abbreviation', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);
            END IF;
            
         END WHILE;
      END IF;

      -- Is there an exemplar name to add?
      SET exemplar_name = TRIM(exemplar_name);
      IF exemplar_name IS NOT NULL AND LENGTH(exemplar_name) > 0 THEN 
         CALL importSearchableTaxon(exemplar_name, 'isolate_exemplar', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);
      END IF;

      -- Should we add any GenBank accessions?
      SET genbank_accession_csv = TRIM(REPLACE(genbank_accession_csv, ',', ';'));
      IF genbank_accession_csv IS NOT NULL AND LENGTH(genbank_accession_csv) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', genbank_accession_csv, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(genbank_accession_csv, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(genbank_accession_csv, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(delimitedName, 'genbank_accession', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);
            END IF;

         END WHILE;
      END IF;
      
      -- Should we add isolate names?
      SET isolate_csv = TRIM(REPLACE(isolate_csv, ',', ';'));
      IF isolate_csv IS NOT NULL AND LENGTH(isolate_csv) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', isolate_csv, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(isolate_csv, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(isolate_csv, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(delimitedName, 'isolate_name', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);
            END IF;

         END WHILE;
      END IF;
      
      -- Should we add RefSeq accessions?
      SET refseq_accession_csv = REPLACE(refseq_accession_csv, ',', ';');
      IF refseq_accession_csv IS NOT NULL AND LENGTH(refseq_accession_csv) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', refseq_accession_csv, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(refseq_accession_csv, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(refseq_accession_csv, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN
               CALL importSearchableTaxon(delimitedName, 'refseq_accession', ictvTaxonomyDB, parent_id, rank_name, ictvTaxonomyDB, taxnode_id, msl_release_num);
            END IF;

         END WHILE;
      END IF;

   END LOOP;

   CLOSE cur;
END //

DELIMITER ;
