
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.initializeD3TaxonomyVisualization = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            console.log("inside attach for d3taxvis, settings = ", settings_)

            console.log("settings_.testModulePath = ", settings_.testModulePath)
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            //window.ICTV.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            //window.ICTV.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            //window.ICTV.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            //window.ICTV.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;
            
            
            // The DOM selector of the container Element added to the page.
            const containerSelector = "#d3_taxonomy_vis_container";
            
            // Create an alias for the asset path.
            const dataURL = settings_.assetPath;

            // TODO: consider retrieving this data from settings (which would be loaded from the database).
            const releases = [
                { year: "Select a release", rankCount: 0 },
                { year: "2022", rankCount: 12 },
                { year: "2021", rankCount: 12 },
                { year: "2020", rankCount: 12 },
                { year: "2019", rankCount: 12 },
                { year: "2018.5", rankCount: 11 },
                { year: "2018", rankCount: 10 },
                { year: "2017", rankCount: 5 },
                { year: "2016", rankCount: 5 },
                { year: "2015", rankCount: 5 },
                { year: "2014", rankCount: 5 },
                { year: "2013", rankCount: 5 },
                { year: "2012", rankCount: 5 },
                { year: "2011", rankCount: 5 },
                { year: "2009", rankCount: 5 },
                { year: "2008", rankCount: 5 },
                { year: "2007", rankCount: 5 },
                { year: "2004", rankCount: 5 },
                { year: "2002.5", rankCount: 5 },
                { year: "2002", rankCount: 5 },
                { year: "1999.5", rankCount: 5 },
                { year: "1999", rankCount: 5 },
                { year: "1998", rankCount: 5 },
                { year: "1997", rankCount: 5 },
                { year: "1996", rankCount: 5 },
                { year: "1995", rankCount: 5 },
                { year: "1993", rankCount: 5 },
                { year: "1991", rankCount: 5 },
                { year: "1990", rankCount: 5 },
                { year: "1987", rankCount: 4 },
                { year: "1984", rankCount: 4 },
                { year: "1982", rankCount: 4 },
                { year: "1981", rankCount: 4 },
                { year: "1979", rankCount: 4 },
                { year: "1978", rankCount: 4 },
                { year: "1976", rankCount: 4 },
                { year: "1975", rankCount: 4 },
                { year: "1974", rankCount: 3 },
                { year: "1971", rankCount: 3 }
            ];
            /*const releases = [
                "--Select a release--",
                "1971", "1974", "1975", "1976", "1978", "1979",
                "1981", "1982", "1984", "1987",
                "1990", "1991", "1993", "1995", "1996", "1997", "1998", "1999",
                "2002", "2004", "2007", "2008", "2009", 
                "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", 
                "2020", "2021", "2022"
            ];*/

            // The taxonomy details page/URL.
            const taxonDetailsURL = settings_.taxonHistoryPage;

            // Initialize the D3 Taxonomy Visualization function.
            window.ICTV.d3TaxonomyVisualization(containerSelector, dataURL, releases, taxonDetailsURL); 
        }
    };
    
})(jQuery, Drupal, drupalSettings);




