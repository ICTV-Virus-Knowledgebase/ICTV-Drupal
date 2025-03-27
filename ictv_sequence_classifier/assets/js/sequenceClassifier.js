
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_sequence_classifier = {

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

            // DMD TEST!!!
            userEmail = null;
            userUID = null;
            userName = null;

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The Drupal web service base URL.
            window.ICTV_SequenceClassifier.AppSettings.drupalWebServiceURL = settings_.drupalWebServiceURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_sequence_classifier_container";

            // Create a new SequenceClassifier instance.
            const sequenceClassifier = new window.ICTV_SequenceClassifier.SequenceClassifier(authToken, contactEmail, 
                containerSelector, userEmail, userName, userUID);

            // Initialize and display the UI.
            sequenceClassifier.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




