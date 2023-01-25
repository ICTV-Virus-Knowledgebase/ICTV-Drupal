
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.initializeD3TaxonomyVisualization = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            console.log("inside attach for d3taxvis, settings = ", settings_)

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            /*
            // The website's base URL.
            window.ICTV.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;
            */

            // The taxon history page name.
            //window.ICTV.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;
            
            
            // The DOM selector of the container Element added to the page.
            const containerSelector = "#d3_taxonomy_vis_container";
            
            // Create an alias for the asset path.
            const dataURL = settings_.assetPath;

            // TEST 
            const taxonDetailsURL = settings_.taxonHistoryPage;
            //"https://ictv.global/taxonomy/taxondetails";

            // Initialize the D3 Taxonomy Visualization function.
            window.ICTV.d3TaxonomyVisualization(containerSelector, dataURL, taxonDetailsURL); 
        }
    };
    
})(jQuery, Drupal, drupalSettings);




