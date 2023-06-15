
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_proposal_submission = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            const authToken = settings_.authToken;
            const userEmail = settings_.userEmail;
            const userName = settings_.userName;
            const userUID = settings_.userUID;

            console.log(`In proposalSubmission.js user email = ${userEmail} and userUID = ${userUID}`);

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_proposal_submission_container";

            // Create a new ProposalSubmission instance.
            const proposalSubmission = new window.ICTV.ProposalSubmission(authToken, containerSelector, 
                userEmail, userName, userUID);

            // Initialize and display the UI.
            proposalSubmission.initialize();

            // Get this user's jobs.
            proposalSubmission.getJobs();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




