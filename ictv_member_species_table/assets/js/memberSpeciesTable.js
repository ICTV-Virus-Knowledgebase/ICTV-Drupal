
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

         // Set the base URL for web services.
         window.ICTV_MemberSpeciesTable.AppSettings.webServiceURL = settings_.webServiceURL;

         // The DOM selector of the container Element added to the page.
         const containerSelector = "#member_species_table_container";

         // Create a new MemberSpeciesTable instance.
         const memberSpeciesTable = new window.ICTV_MemberSpeciesTable.MemberSpeciesTable(containerSelector);

         // Initialize and display the table.
         memberSpeciesTable.initialize();
         memberSpeciesTable.loadTableUsingPageName();
      }
   };

})(jQuery, Drupal, drupalSettings);




