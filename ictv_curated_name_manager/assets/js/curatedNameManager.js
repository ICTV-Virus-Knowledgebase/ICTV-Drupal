
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_curated_name_manager = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            const authToken = settings_.authToken;
            const userEmail = settings_.userEmail;
            const userName = settings_.userName;
            const userUID = settings_.userUID;

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_CuratedNameManager AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The base web service URL (Windows).
            window.ICTV_CuratedNameManager.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            // TODO: remove the hard-coded MSL release below!!!
            window.ICTV_CuratedNameManager.AppSettings.currentMslRelease = 39; //settings_.currentMslRelease;

            // The current VMR.
            window.ICTV_CuratedNameManager.AppSettings.currentVMR = settings_.currentVMR;

            // The Drupal web service base URL.
            window.ICTV_CuratedNameManager.AppSettings.drupalWebServiceURL = settings_.drupalWebServiceURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_curated_name_manager_container";

            // Create a new CuratedNameManager component instance.
            const curatedNameManager = new window.ICTV_CuratedNameManager.CuratedNameManager(authToken, containerSelector, userEmail, userName, userUID);

            // Initialize and display the UI.
            curatedNameManager.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




