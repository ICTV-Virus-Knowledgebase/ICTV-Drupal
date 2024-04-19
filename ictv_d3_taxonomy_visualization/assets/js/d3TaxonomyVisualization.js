
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.initializeD3TaxonomyVisualization = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            // Create the ICTV namespace if it doesn't already exist.
            if (!window.ICTV) { window.ICTV = {}; }

            // Create a placeholder for AppSettings if it doesn't exist.
            if (!window.ICTV.AppSettings) { window.ICTV.AppSettings = {}; }

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The base web service URL.
            window.ICTV.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV.AppSettings.currentMslRelease = settings_.currentMslRelease;
            
            // The DOM selector of the container Element added to the page.
            const containerSelector = "#d3_taxonomy_vis_container";
            
            // Create an alias for the asset path.
            const dataURL = settings_.assetPath;

            // The taxonomy details page/URL.
            const taxonDetailsURL = settings_.taxonHistoryPage;

            // The taxonomy web service URL.
            const taxonomyURL = `${window.ICTV.AppSettings.baseWebServiceURL}taxonomy.ashx`;

            // Load the releases metadata from the releases JSON file.
            $.getJSON(`${dataURL}/data/releases.json`).done((releases) => {

               if (!releases) { throw new Error("Invalid releases JSON"); }

               // Initialize the D3 Taxonomy Visualization function.
               window.ICTV.d3TaxonomyVisualization(containerSelector, window.ICTV.AppSettings.currentMslRelease,
                  dataURL, releases, taxonDetailsURL, taxonomyURL); 
            });
        }
    };
    
})(jQuery, Drupal, drupalSettings);




