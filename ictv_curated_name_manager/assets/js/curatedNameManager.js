
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_curated_name_manager = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_VirusNameLookup AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The current MSL release number.
            window.ICTV_VirusNameLookup.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The current VMR.
            window.ICTV_VirusNameLookup.AppSettings.currentVMR = settings_.currentVMR;

            // The Drupal web service base URL.
            window.ICTV_VirusNameLookup.AppSettings.drupalWebServiceURL = settings_.drupalWebServiceURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_curated_name_manager_container";

            // Create a new CuratedNameManager component instance.
            const curatedNameManager = new window.ICTV_CuratedNameManager.CuratedNameManager(containerSelector);

            // Initialize and display the UI.
            curatedNameManager.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




