
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_taxablast_ui = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            let userEmail = settings_.userEmail;
            let userName = settings_.userName;
            let userUID = settings_.userUID;

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The app server (web service) URL.
            window.ICTV_TaxaBLAST.AppSettings.appServerURL = settings_.appServerURL;

            // The JWT auth token
            window.ICTV_TaxaBLAST.AppSettings.authToken = settings_.authToken;

            // The taxonomy details page.
            window.ICTV_TaxaBLAST.AppSettings.taxonDetailsPage = settings_.taxonDetailsPage;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_taxablast_container";

            // Create a new TaxaBLAST instance.
            const taxaBLAST = new window.ICTV_TaxaBLAST.TaxaBLAST(containerSelector, userEmail, userName, userUID);

            // If the settings have info icon data, add it to the taxaBLAST instance.
            if (settings_.infoIcons) { taxaBLAST.infoIcons = JSON.parse(settings_.infoIcons); }

            // Initialize and display the UI.
            taxaBLAST.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




