
DROP PROCEDURE IF EXISTS `ImportLatestSpeciesIsolates`;

DELIMITER //

CREATE PROCEDURE ImportLatestSpeciesIsolates()
BEGIN
   DECLARE delimitedName VARCHAR(300);
   DECLARE division VARCHAR(20);
   DECLARE done INT DEFAULT FALSE;
   DECLARE errorMessage VARCHAR(200);
   DECLARE genbankAccessions LONGTEXT;
   DECLARE ictvID INT(11);
   DECLARE ictvTaxonomyDB VARCHAR(20);
   DECLARE ictvVmrDB VARCHAR(20);
   DECLARE isolateAbbrevs LONGTEXT;
   DECLARE isolateDesignation LONGTEXT;
   DECLARE isolateID INT(11);
   DECLARE isolateNames LONGTEXT;
   DECLARE mslRelease INT(11);
   DECLARE name_end INT;
   DECLARE name_pos INT DEFAULT 1;
   DECLARE rankName VARCHAR(20);
   DECLARE refseqAccessions LONGTEXT;
   DECLARE refseqOrganism LONGTEXT;
   DECLARE speciesName VARCHAR(300);
   DECLARE taxnodeID INT(11);

   -- NOTE: Make sure the views v_species_isolates, v_taxonomy_level, and v_taxonomy_node have been 
   -- updated with the name of the current ICTVonline* database!

   -- For convenience, here's the signature of the stored procedure that imports searchable_taxon records:
   -- importSearchableTaxon(ICTV taxnode ID, name, nameClass, parentTaxonomyDB, parentTaxonomyID, rankName, taxonomyDB, taxonomyID, versionID)

   -- A cursor to fetch species isolate data.
   DECLARE cur CURSOR FOR 
   
      SELECT
         CASE 
            WHEN si.host_source LIKE '%bacteria%' OR si.host_source LIKE '%archaea%' THEN 'phages' ELSE 'viruses'
         END AS division,
         si.genbank_accessions,
         tn.ictv_id,
         si.isolate_abbrevs,
         si.isolate_designation,
         si.isolate_id,
         si.isolate_names,
         tn.msl_release_num,
         si.refseq_accessions,
         si.refseq_organism,
         si.species_name,
         si.taxnode_id

      FROM v_species_isolates si
      JOIN v_taxonomy_node tn ON tn.taxnode_id = si.taxnode_id;

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN cur;

   -- The parent database
   SET ictvTaxonomyDB = 'ictv_taxonomy';

   -- The source taxonomy database
   SET ictvVmrDB = 'ictv_vmr';

   -- The rank name of the species isolate
   SET rankName = 'isolate';


   read_loop: LOOP

      FETCH cur INTO division, genbankAccessions, ictvID, isolateAbbrevs, isolateDesignation, isolateID, 
         isolateNames, mslRelease, refseqAccessions, refseqOrganism, speciesName, taxnodeID;

      IF done THEN
         LEAVE read_loop;
      END IF;

      -- Validate the ictvID (required).
      IF ictvID IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid ictvID';
      END IF;

      -- Validate the isolateID (required).
      IF isolateID IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid isolateID';
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

      -- Default division to "viruses".
      IF division IS NULL OR LENGTH(division) < 1 THEN
         SET division = 'viruses';
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

               -- Create a searchable_taxon record.
               CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", delimitedName, 'genbank_accession', ictvTaxonomyDB, 
                  taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
            END IF;

         END WHILE;
      END IF;

      -- Should we add any isolate abbreviations?
      SET isolateAbbrevs = TRIM(REPLACE(isolateAbbrevs, ',', ';'));
      IF isolateAbbrevs IS NOT NULL AND LENGTH(isolateAbbrevs) > 0 THEN

         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', isolateAbbrevs, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(isolateAbbrevs, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(isolateAbbrevs, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN

               -- Create a searchable_taxon record.
               CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", delimitedName, 'isolate_abbreviation', ictvTaxonomyDB, 
                  taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
            END IF;

         END WHILE;
      END IF;

      -- Should we add any isolate designations?
      SET isolateDesignation = TRIM(REPLACE(isolateDesignation, ',', ';'));
      IF isolateDesignation IS NOT NULL AND LENGTH(isolateDesignation) > 0 THEN
      
         SET name_pos = 1;
         WHILE name_pos > 0 DO
            SET name_end = LOCATE(';', isolateDesignation, name_pos);
            IF name_end = 0 THEN
               SET delimitedName = SUBSTRING(isolateDesignation, name_pos);
               SET name_pos = 0;
            ELSE
               SET delimitedName = SUBSTRING(isolateDesignation, name_pos, name_end - name_pos);
               SET name_pos = name_end + 1;
            END IF;

            SET delimitedName = TRIM(delimitedName);
            IF delimitedName IS NOT NULL AND LENGTH(delimitedName) > 0 THEN

               -- Create a searchable_taxon record.
               CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", delimitedName, 'isolate_designation', ictvTaxonomyDB, 
                  taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
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

               -- Create a searchable_taxon record.
               CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", delimitedName, 'isolate_name', ictvTaxonomyDB, 
                  taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
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

               -- Create a searchable_taxon record.
               CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", delimitedName, 'refseq_accession', ictvTaxonomyDB, 
                  taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
            END IF;

         END WHILE;
      END IF;

      -- Was a RefSeq organism provided?
      SET refseqOrganism = TRIM(refseqOrganism);
      IF refseqOrganism IS NOT NULL AND LENGTH(refseqOrganism) > 0 THEN

         -- Create a searchable_taxon record.
         CALL importSearchableTaxon(division, ictvID, taxnodeID, speciesName, "species", refseqOrganism, 'refseq_organism', ictvTaxonomyDB, 
            taxnodeID, rankName, ictvVmrDB, isolateID, mslRelease);
      END IF;

   END LOOP;

   CLOSE cur;
END //

DELIMITER ;
