
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_proposal_submission = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            

            /*
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            window.ICTV.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            window.ICTV.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;
            */

            const authToken = settings_.authToken;
            const userEmail = settings_.userEmail;
            const userName = settings_.userName;
            const userUID = settings_.userUID;

            console.log("In proposalSubmission:")
            console.log("authToken = ", authToken)
            console.log("userEmail = ", userEmail)
            console.log("name = ", userName)
            console.log("userUID = ", userUID)



            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_proposal_submission_container";

            // Create a new ProposalSubmission instance.
            const proposalSubmission = new window.ICTV.ProposalSubmission(authToken, containerSelector, 
                userEmail, userName, userUID);

            // Initialize and display the UI.
            proposalSubmission.initialize();


            const test = proposalSubmission.getJobs(1234);
            console.log(test)
        }
    };
    
})(jQuery, Drupal, drupalSettings);




