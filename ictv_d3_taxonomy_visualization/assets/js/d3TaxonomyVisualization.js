
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.initializeD3TaxonomyVisualization = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //console.log("inside attach for d3taxvis, settings = ", settings_)

            // Create the ICTV namespace if it doesn't already exist.
            if (!window.ICTV) { window.ICTV = {}; }

            // Create a placeholder for AppSettings if it doesn't exist.
            if (!window.ICTV.AppSettings) { window.ICTV.AppSettings = {}; }

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
                { year: "2022", label: "2022", rankCount: 12 },
                { year: "2021", label: "2021", rankCount: 12 },
                { year: "2020", label: "2020", rankCount: 12},
                { year: "2019", label: "2019", rankCount: 12 },
                { year: "2018.5", label: "2018b", rankCount: 11 },
                { year: "2018", label: "2018a", rankCount: 10},
                { year: "2017", label: "2017", rankCount: 5 },
                { year: "2016", label: "2016", rankCount: 5 },
                { year: "2015", label: "2015", rankCount: 5 },
                { year: "2014", label: "2014", rankCount: 5},
                { year: "2013", label: "2013", rankCount: 5 },
                { year: "2012", label: "2012", rankCount: 5 },
                { year: "2011", label: "2011", rankCount: 5 },
                { year: "2009", label: "2009", rankCount: 5 },
                { year: "2008", label: "2008", rankCount: 5 },
                { year: "2007", label: "2007", rankCount: 5 },
                { year: "2004", label: "2004", rankCount: 5 },
                { year: "2002.5", label: "2002b", rankCount: 5},
                { year: "2002", label: "2002a", rankCount: 5 },
                { year: "1999.5", label: "1999b", rankCount: 5 },
                { year: "1999", label: "1999a", rankCount: 5 },
                { year: "1998", label: "1998", rankCount: 5 },
                { year: "1997", label: "1997", rankCount: 5 },
                { year: "1996", label: "1996", rankCount: 5 },
                { year: "1995", label: "1995", rankCount: 5},
                { year: "1993", label: "1993", rankCount: 5 },
                { year: "1991", label: "1991", rankCount: 5 },
                { year: "1990", label: "1990", rankCount: 5 },
                { year: "1987", label: "1987", rankCount: 4 },
                { year: "1984", label: "1984", rankCount: 4 },
                { year: "1982", label: "1982", rankCount: 4 },
                { year: "1981", label: "1981", rankCount: 4 },
                { year: "1979", label: "1979", rankCount: 4 },
                { year: "1978", label: "1978", rankCount: 4 },
                { year: "1976", label: "1976", rankCount: 4 },
                { year: "1975", label: "1975", rankCount: 4 },
                { year: "1974", label: "1974", rankCount: 3 },
                { year: "1971", label: "1971", rankCount: 3 }
            ];

            // The taxonomy details page/URL.
            const taxonDetailsURL = settings_.taxonHistoryPage;

            // Initialize the D3 Taxonomy Visualization function.
            window.ICTV.d3TaxonomyVisualization(containerSelector, dataURL, releases, taxonDetailsURL); 
        }
    };
    
})(jQuery, Drupal, drupalSettings);




