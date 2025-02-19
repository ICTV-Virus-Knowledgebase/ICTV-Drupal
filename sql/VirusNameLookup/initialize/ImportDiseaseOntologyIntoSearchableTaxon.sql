
DROP PROCEDURE IF EXISTS `ImportDiseaseOntologyIntoSearchableTaxon`;

DELIMITER //

-- Import disease_ontology records into searchable_taxon.
CREATE PROCEDURE ImportDiseaseOntologyIntoSearchableTaxon()
BEGIN

   DECLARE diseaseNameClassTID INT;
   DECLARE diseaseOntologyDbTID INT;
   

   -- Lookup the term ID for the name class "disease".
   SET diseaseNameClassTID = (SELECT id FROM term WHERE full_key = 'name_class.disease');
   IF diseaseNameClassTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid disease name class term ID';
   END IF;

   -- Lookup the term ID for the Disease Ontology taxonomy DB.
   SET diseaseOntologyDbTID = (SELECT id FROM term WHERE full_key = 'taxonomy_db.disease_ontology');
   IF diseaseOntologyDbTID IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid disease ontology taxonomy DB term ID';
   END IF;


   -- Delete existing disease_ontology records from searchable_taxon.
   DELETE FROM searchable_taxon WHERE taxonomy_db_tid = diseaseOntologyDbTID;


   -- Import disease_ontology records into searchable_taxon.
	INSERT INTO searchable_taxon (
      alternate_id,
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
      d.doid, -- alternate_id
      (SELECT id FROM term WHERE full_key = CASE 
         WHEN tn.host_source LIKE '%bacteria%' OR tn.host_source LIKE '%archaea%' THEN 'ncbi_division.phages' ELSE 'ncbi_division.viruses'
      END) AS division_tid,
		getFilteredName(d.disease_name), -- filtered_name
      d.ictv_id,
      d.ictv_taxnode_id,
      d.ncbi_name, -- intermediate_name
      TRIM(nnode.rank_name), -- intermediate_rank
		d.disease_name, -- name
		diseaseNameClassTID, -- name_class_tid
		NULL, -- parent_taxonomy_db_tid
		NULL, -- parent_taxonomy_id
		(SELECT id FROM term WHERE full_key = CONCAT('taxonomy_rank.', tn.rank_name)) AS rank_name_tid,
		diseaseOntologyDbTID, -- taxonomy_db_tid
		id, -- taxonomy_id
      1 -- version_id

   FROM disease_ontology d
   JOIN v_taxonomy_node_names tn on tn.taxnode_id = d.ictv_taxnode_id
   LEFT JOIN ncbi_node nnode ON nnode.tax_id = d.ncbi_taxid; 


END //

DELIMITER ;

