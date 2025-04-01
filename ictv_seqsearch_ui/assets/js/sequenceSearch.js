
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_seqsearch_ui = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            const authToken = settings_.authToken;
            const contactEmail = "info@ictv.global";
            let userEmail = settings_.userEmail;
            let userName = settings_.userName;
            let userUID = settings_.userUID;

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The Drupal web service base URL.
            window.ICTV_SequenceSearch.AppSettings.drupalWebServiceURL = settings_.drupalWebServiceURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_seqsearch_container";

            // Create a new SequenceSearch instance.
            const sequenceSearch = new window.ICTV_SequenceSearch.SequenceSearch(authToken, contactEmail, 
                containerSelector, userEmail, userName, userUID);

            // Initialize and display the UI.
            sequenceSearch.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




