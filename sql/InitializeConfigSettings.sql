
-- Initialize the appServerURL setting
INSERT INTO ictv_settings (
   description,
   name,
   value,
   updated_by,
   updated_on
)
SELECT
   '',
   'appServerURL',
   value,
   1,
   CURRENT_TIMESTAMP
FROM ictv_settings
WHERE name = 'drupalWebServiceURL'
AND NOT EXISTS (
   SELECT 1
   FROM ictv_settings
   WHERE name = 'appServerURL'
)
LIMIT 1;

-- Initialize the webServiceURL setting
INSERT INTO ictv_settings (
   description,
   name,
   value,
   updated_by,
   updated_on
)
SELECT
   '',
   'webServiceURL',
   value,
   1,
   CURRENT_TIMESTAMP
FROM ictv_settings
WHERE name = 'applicationURL'
AND NOT EXISTS (
   SELECT 1
   FROM ictv_settings
   WHERE name = 'webServiceURL'
)
LIMIT 1;

-- Initialize the taxonDetailsPage setting
INSERT INTO ictv_settings (
   description,
   name,
   value,
   updated_by,
   updated_on
)
SELECT
   '',
   'taxonDetailsPage',
   value,
   1,
   CURRENT_TIMESTAMP
FROM ictv_settings
WHERE name = 'taxonHistoryPage'
AND NOT EXISTS (
   SELECT 1
   FROM ictv_settings
   WHERE name = 'taxonDetailsPage'
)
LIMIT 1;

