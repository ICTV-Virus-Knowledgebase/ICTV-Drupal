
DELIMITER //

CREATE OR REPLACE PROCEDURE getEtymology(
   IN ictvID INT,
   IN isolateID INT,
   IN mslRelease INT,
   IN searchTaxon NVARCHAR(100),
   IN taxnodeID INT
)
BEGIN

   -- Normalize input parameters to simplify later processing.
   IF ictvID IS NOT NULL AND ictvID < 1 THEN
      SET ictvID = NULL;
   END IF;

   IF isolateID IS NOT NULL AND isolateID < 1 THEN
      SET isolateID = NULL;
   END IF;
	
   IF mslRelease IS NOT NULL AND mslRelease < 1 THEN
      SET mslRelease = NULL;
   END IF;

   SET searchTaxon = TRIM(searchTaxon);
	IF searchTaxon IS NOT NULL AND LENGTH(searchTaxon) < 1 THEN
		SET searchTaxon = NULL;
	END IF;

   IF taxnodeID IS NOT NULL AND taxnodeID < 1 THEN
      SET taxnodeID = NULL;
   END IF;


   -- If a search taxon was provided (but not a taxnodeID), use it to look up the target node.
   IF taxnodeID IS NULL AND searchTaxon IS NOT NULL THEN

      -- Default the MSL release number to the most recent if not provided.
      IF mslRelease IS NULL OR mslRelease < 1 THEN
         SELECT MAX(msl_release_num) INTO mslRelease FROM taxonomy_toc;
      END IF;

      -- Use the searchTaxon to look up the target node.
      SELECT tn.taxnode_id
      INTO taxnodeID
      FROM taxonomy_node tn
      WHERE tn.name = searchTaxon
      AND tn.msl_release_num = mslRelease
      LIMIT 1;

      IF taxnodeID IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 1644, MESSAGE_TEXT = 'No taxonomy node was found for the searchTaxon provided';
      END IF;

   END IF;

   
   SELECT 
      tnn.taxnode_id,
      tnn.name,
      
      realm.taxon_name AS realm_name,
      realm.etymology AS realm_ety,

      subrealm.taxon_name AS subrealm_name,
      subrealm.etymology AS subrealm_ety,

      kingdom.taxon_name AS kingdom_name,
      kingdom.etymology AS kingdom_ety,

      subkingdom.taxon_name AS subkingdom_name,
      subkingdom.etymology AS subkingdom_ety,

      phylum.taxon_name AS phylum_name,
      phylum.etymology AS phylum_ety,

      subphylum.taxon_name AS subphylum_name,
      subphylum.etymology AS subphylum_ety,

      `class`.taxon_name AS class_name,
      `class`.etymology AS class_ety,

      subclass.taxon_name AS subclass_name,
      subclass.etymology AS subclass_ety,

      `order`.taxon_name AS order_name,
      `order`.etymology AS order_ety,

      suborder.taxon_name AS suborder_name,
      suborder.etymology AS suborder_ety,

      family.taxon_name AS family_name,
      family.etymology AS family_ety,

      subfamily.taxon_name AS subfamily_name,
      subfamily.etymology AS subfamily_ety,

      genus.taxon_name AS genus_name,
      genus.etymology AS genus_ety,

      subgenus.taxon_name AS subgenus_name,
      subgenus.etymology AS subgenus_ety,

      species.taxon_name AS species_name,
      species.etymology AS species_ety

   FROM taxonomy_node_names tnn
   LEFT JOIN v_etymology realm ON realm.taxon_name = tnn.realm 
   LEFT JOIN v_etymology subrealm ON subrealm.taxon_name = tnn.subrealm
   LEFT JOIN v_etymology kingdom ON kingdom.taxon_name = tnn.kingdom
   LEFT JOIN v_etymology subkingdom ON subkingdom.taxon_name = tnn.subkingdom
   LEFT JOIN v_etymology phylum ON phylum.taxon_name = tnn.phylum
   LEFT JOIN v_etymology subphylum ON subphylum.taxon_name = tnn.subphylum
   LEFT JOIN v_etymology `class` ON `class`.taxon_name = tnn.class
   LEFT JOIN v_etymology subclass ON subclass.taxon_name = tnn.subclass
   LEFT JOIN v_etymology `order` ON `order`.taxon_name = tnn.order
   LEFT JOIN v_etymology suborder ON suborder.taxon_name = tnn.suborder
   LEFT JOIN v_etymology family ON family.taxon_name = tnn.family
   LEFT JOIN v_etymology subfamily ON subfamily.taxon_name = tnn.subfamily
   LEFT JOIN v_etymology genus ON genus.taxon_name = tnn.genus
   LEFT JOIN v_etymology subgenus ON subgenus.taxon_name = tnn.subgenus
   LEFT JOIN v_etymology species ON species.taxon_name = tnn.species
   
   WHERE tnn.taxnode_id = 202504737
   
   /*
   -- Etymology
   LEFT JOIN ictv.webform_submission_data wsd ON (
      wsd.name = 'taxon'
      AND (wsd.value = realm.name
         OR wsd.value = subrealm.name
         OR wsd.value = kingdom.name
         OR wsd.value = subkingdom.name
         OR wsd.value = phylum.name
         OR wsd.value = subphylum.name
         OR wsd.value = `class`.name
         OR wsd.value = subclass.name
         OR wsd.value = `order`.name
         OR wsd.value = suborder.name
         OR wsd.value = family.name
         OR wsd.value = subfamily.name
         OR wsd.value = genus.name
         OR wsd.value = subgenus.name
         OR wsd.value = species.name
      )
   )
   LEFT JOIN ictv.webform_submission ws ON (
      ws.sid = wsd.sid
      AND ws.webform_id = 'etymology'
   )
   LEFT JOIN ictv.webform_submission_data ety_wsd ON (
      ety_wsd.sid = ws.sid
      AND ety_wsd.name = 'etymology'
   )*/

   WHERE (ictvID IS NOT NULL AND tnn.ictv_id = ictvID AND (mslRelease IS NULL OR tnn.msl_release_num = mslRelease))
   /*OR (isolateID IS NOT NULL AND tn.taxnode_id = (
      SELECT si.taxnode_id
      FROM species_isolates si
      WHERE si.isolate_id = isolateID
      LIMIT 1
   ))*/
   OR (searchTaxon IS NOT NULL AND tnn.name = searchTaxon AND (mslRelease IS NULL OR tnn.msl_release_num = mslRelease))
   OR (taxnodeID IS NOT NULL AND tnn.taxnode_id = taxnodeID)
   ORDER BY tnn.msl_release_num DESC
   
   -- ORDER BY taxon_sort, taxon_name;

END//

DELIMITER ;