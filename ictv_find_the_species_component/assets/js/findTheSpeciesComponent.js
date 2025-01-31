
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_find_the_species_component = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_VirusNameLookup AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The application URL
            window.ICTV_VirusNameLookup.AppSettings.applicationURL = settings_.applicationURL;

            // The DOM selector of the container Element added to the page.
            const containerSelector = "#ictv_virus_name_lookup_container";

            // Create a new VirusNameLookup component instance.
            const virusNameLookup = new window.ICTV_VirusNameLookup.VirusNameLookup(containerSelector);

            // Initialize and display the UI.
            virusNameLookup.initializeMinimalComponent();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




