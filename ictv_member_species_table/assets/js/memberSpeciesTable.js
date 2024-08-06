
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_member_species_table = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            window.ICTV_MemberSpeciesTable.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV_MemberSpeciesTable.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV_MemberSpeciesTable.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV_MemberSpeciesTable.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            window.ICTV_MemberSpeciesTable.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;


            // The DOM selector of the container Element added to the page.
            const containerSelector = "#member_species_table_container";

            // Get the pathname from the URL
            let pathname = new URL(document.location).pathname;

            // Make sure the pathname doesn't end in a slash.
            if (pathname.endsWith("/")) { pathname = pathname.substring(0, pathname.length - 2); }

            let lastSlash = pathname.lastIndexOf("/");
            if (lastSlash < 1) { throw new Error("Invalid URL: no last slash was found"); }

            // The taxon name should be to the right of the last slash in the pathname.
            let taxonName = pathname.substring(lastSlash + 1);

            let onlyUnassigned = false;

            if (taxonName === "unassigned") {

                // Remove "/unassigned" from the path.
                pathname = pathname.substring(0, lastSlash);

                lastSlash = pathname.lastIndexOf("/");
                if (lastSlash < 1) { throw new Error("Invalid URL: no last slash was found"); }

                // The taxon name should be to the right of the last slash in the pathname.
                taxonName = pathname.substring(lastSlash + 1);

                onlyUnassigned = true;
            }

            // Create a new MemberSpeciesTable instance.
            const memberSpeciesTable = new window.ICTV_MemberSpeciesTable.MemberSpeciesTable(containerSelector);

            // Initialize and display the table.
            memberSpeciesTable.initialize(taxonName, window.ICTV.AppSettings.currentMslRelease, onlyUnassigned);
        }
    };
    
})(jQuery, Drupal, drupalSettings);




