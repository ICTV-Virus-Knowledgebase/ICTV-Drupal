

(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_taxon_details = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_TaxonDetails AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            window.ICTV_TaxonDetails.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV_TaxonDetails.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV_TaxonDetails.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV_TaxonDetails.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            window.ICTV_TaxonDetails.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;
            
            // Create a new TaxonDetails instance.
            const taxonDetails = new window.ICTV_TaxonDetails.TaxonDetails("#taxon_details_container");

            // Initialize and display the component.
            taxonDetails.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




