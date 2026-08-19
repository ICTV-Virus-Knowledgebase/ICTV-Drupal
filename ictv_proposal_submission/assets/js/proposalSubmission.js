
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_proposal_submission = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            const contactEmail = "info@ictv.global";
            const userEmail = settings_.userEmail;
            const userName = settings_.userName;
            const userUID = settings_.userUID;

            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_ProposalSubmission AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The Drupal web service base URL.
            window.ICTV_ProposalSubmission.AppSettings.authToken = settings_.authToken;
            window.ICTV_ProposalSubmission.AppSettings.appServerURL = settings_.appServerURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_proposal_submission_container";

            // Create a new ProposalSubmission instance.
            const proposalSubmission = new window.ICTV_ProposalSubmission.ProposalSubmission(contactEmail, 
                containerSelector, userEmail, userName, userUID);

            // Initialize and display the UI.
            proposalSubmission.initialize();

            // Get this user's jobs.
            proposalSubmission.getJobs();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




