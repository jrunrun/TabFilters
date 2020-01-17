// Simple helper function
function buildVizUrl(tableauServerBaseUrl, siteContentUrl, workbook, view){
    if(siteContentUrl === null){
        vizUrl = tableauServerBaseUrl + "/views/" + workbook + "/" + view;
    }
    else{
        vizUrl = tableauServerBaseUrl + "/t/" + siteContentUrl + "/views/" + workbook + "/" + view;
    }
    return vizUrl;
}


// viz options
var vizOptions = {
    width: '1000px',
    height: '800px',
    hideTabs: true,
    hideToolbar: true,
    onFirstInteractive: defaultOnFirstInteractive
}


// Basic viz initializer to be shared
function initializeViz(placeholderDivId, url, options) {

  // url = buildVizUrl("https://demo.tableau.com", "Tableau", "Superstore_Justin", "Customers");
  url = 'https://demo.tableau.com/t/Tableau/views/SuperTest/TestDash';
  console.log("url:", url);

  var containerDiv = document.getElementById("vizContainer");
  var viz = new tableau.Viz(containerDiv, url, 	vizOptions);

}


function defaultOnFirstInteractive(v){

	viz = v.getViz();
  // tabScale.initialize();
	activeWorkbook = viz.getWorkbook();
	activeSheet = activeWorkbook.getActiveSheet();
  uiFiltersOnFirstInteractive(viz); // in embedded_system.js
  // console.log(activeWorkbook);
  // console.log(activeSheet);

  // test this approach later
  // specificSheet = activeSheet.getWorksheets().get("Map");
	// activeSheetName = activeSheet.getName();

}


// Global default onFirstInteractive callback function
async function uiFiltersOnFirstInteractive(viz){

	// viz = v.getViz();
	// activeWorkbook = viz.getWorkbook();
	// activeSheet = activeWorkbook.getActiveSheet();
	// activeSheetName = activeSheet.getName();

  viz.revertAllAsync();

	var filters = await (new TabFilters(viz)).init();
  // global var (wsFilterInfoGlobal) for accessing via browser web console debug
	console.log("filters: ", filters);

  // testing
  // let categoricalFilters = filters.getFiltersByType('categorical');
  // console.log("categoricalFilters:", categoricalFilters);
  // let quantitativeFilters = filters.getFiltersByType('quantitative');
  // console.log("quantitativeFilters:", quantitativeFilters);
  listenToFilterSelection();

  // filters.applyFilters("Region", ["South"]);
  // filters.applyFilters("State", ["Texas","Utah"]);
  // filters.applyFilters("Ship Mode", ["First"]);

  // filters.applyCategoricalFilters("REPLACE", "State", ["Texas","Utah"]);

	// filterDataForSelect2 = filters.getFilterDataForSelect2();
  // console.log("getFilterDataForSelect2:", filterDataForSelect2);

	// wireFilters(filterDataForSelect2);


}




function listenToFilterSelection() {
          viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, onFilterSelection);

}

function onFilterSelection(marksEvent) {
            console.log("filter change!");
            return marksEvent.getFilterAsync().then(reportSelectedFilters);
}

function reportSelectedFilters(filters) {
  console.log("filters selected:", filters);
}
