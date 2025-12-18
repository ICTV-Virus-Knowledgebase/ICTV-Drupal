
SELECT *
FROM (
	SELECT wsd.sid,
      MAX(CASE WHEN wsd.name = 'taxon' THEN wsd.value END) AS taxon_name,
      MAX(CASE WHEN wsd.name = 'taxon_sort' THEN wsd.value END) AS taxon_sort,
      MAX(CASE WHEN wsd.name = 'etymology' THEN wsd.value END) AS etymology,
      MAX(CASE WHEN wsd.name = 'ety_html' THEN wsd.value END) AS ety_html,
      MAX(CASE WHEN wsd.name = 'proposal1' AND wsd.property = 'title' THEN wsd.value END) AS proposal_title,
      MAX(CASE WHEN wsd.name = 'proposal1' AND wsd.property = 'url' THEN wsd.value END) AS proposal_url,
      MAX(CASE WHEN wsd.name = 'rank' THEN wsd.value END) AS taxon_rank
               
   FROM ictv.webform_submission ws
   JOIN ictv.webform_submission_data wsd ON wsd.sid = ws.sid
   WHERE ws.webform_id = 'etymology'
   AND wsd.value IS NOT NULL
   AND wsd.value <> ''
   GROUP BY ws.sid
) taxa
