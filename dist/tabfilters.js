// filter class to fetch filter metadata from Tableau JS API

class TabFilters {
	constructor(viz){
		this.wb = viz.getWorkbook();
		this.activeSheet = this.wb.getActiveSheet();
		this.activeSheetType = this.activeSheet.getSheetType();
		this.isActive = this.activeSheet.getIsActive();
		this.worksheetsArray = [];
    this.filtersArray = [];
	 }

  async init(){
	  switch (this.activeSheetType) {
      case "worksheet":
		const filters = await this._getFilters(activeSheet);
        this.filtersArray.push(filters);
        break;
      case "dashboard":
		  let dash_objects = this.activeSheet.getObjects();
		  for (var i = 0; i < dash_objects.length; i++) {
			let sheet_obj = dash_objects[i];
			let sheet_obj_type = sheet_obj.getObjectType();
			if (sheet_obj_type == 'worksheet') {
			  let ws_obj = sheet_obj.getWorksheet();
        // console.log("ws_obj:", ws_obj);
        // this.worksheetsArray.push(ws_obj);
        this.worksheetsArray.push({"worksheetName" : ws_obj.getName(), "worksheetObject" : ws_obj});
			  const filters = await this._getFilters(ws_obj);
        // console.log("filters in class: ", filters);
			  this.filtersArray.push(filters);
			}
		  }
      break;
    }
	// maybe convert from "worksheet -> filter array"	to "filter -> worksheet array" instead of doing this in getFilterDataForSelect2()
	return this;
  }

  getAllFilters(){
	  return this.filtersArray;
  }

  getAllWorksheets(){
	  return this.worksheetsArray;
  }
// should I declare and build arrays that I return in the methods or declare them in the constructor and build in the init

  getFilterDataForSelect2(){
    let all_worksheets = this.filtersArray;
    // note: adjust scope as necessary if other methods need access to this array
    let filterInfoArray = [];

    for (let i = 0; i < all_worksheets.length; i++) {
      let filters_objs = all_worksheets[i];
      // console.log("i-index: ", i);
      // iterate through the array of filter objects
      for (let j = 0; j < filters_objs.length; j++) {

        let worksheetObject = filters_objs[j].getWorksheet();
        let worksheetName = filters_objs[j].getWorksheet().getName();
        let filterType = filters_objs[j].getFilterType();
        let fieldName = filters_objs[j].getFieldName();


				if (fieldName.toLowerCase() != "measure names" && fieldName.toLowerCase().includes("action") == false) {

					switch (filterType) {

	          case 'categorical':

	            let temp_uniqueValues = [];
	            // reformat to include "id" for select2 e.g. { id: 1, text: "Office Supplies" }
	            for (let n = 0; n < filters_objs[j].getAppliedValues().length; n++){
	              // temp_uniqueValues.push({"id" : n, "text" : filters_objs[j].getAppliedValues()[n].formattedValue});
	              temp_uniqueValues.push({"id" : n, "text" : filters_objs[j].getAppliedValues()[n].formattedValue, "tableauRawValue" : filters_objs[j].getAppliedValues()[n].value});
	            }

	            filterInfoArray.push({"filterFieldName" : fieldName, "filterType" : filterType, "filterDomainValues" : temp_uniqueValues, "targetWorksheet" : {"targetWorksheetName" : worksheetName, "targetWorksheetObject" : worksheetObject}});
	            break;

	          case 'quantitative':
	            let temp_domainMax = filters_objs[j].getDomainMax();
	            let temp_domainMin = filters_objs[j].getDomainMin();

	            filterInfoArray.push({"filterFieldName" : fieldName, "filterType" : filterType, "filterDomainMax" : temp_domainMax, "filterDomainMin" : temp_domainMin, "targetWorksheet" : {"targetWorksheetName" : worksheetName, "targetWorksheetObject" : worksheetObject}});
	            // filterInfoArray.push(
							//
							// 											{
							// 												"filterFieldName" : fieldName,
							// 												"filterType" : filterType,
							// 												"filterDomainMax" : temp_domainMax,
							// 												"filterDomainMin" : temp_domainMin,
							// 												"targetWorksheet" : {"targetWorksheetName" : worksheetName, "targetWorksheetObject" : worksheetObject}
							// 											}
							//
							// 									 );
	            break;

	            // // FUTURE - support date types
	            // case "date":
	            //
	            // break;

	        }

				}

      }

    }


		// this normalizes array of filter -> sheets
		// how do I make this genaralize this to make it work quantitative, date, etc.
		// common: fieldName, filterType, targetWorksheet
		// uncommon: domainValues and min/max
		console.log("filterInfoArray b4 normalize: ", filterInfoArray);

		// return array of unique filterFieldName
		var filterFieldNameArray = [... new Set(filterInfoArray.map(data => data.filterFieldName))];
		console.log("filterFieldNameArray", filterFieldNameArray);
		// then loop through unique filterFieldNameArray and return normalized array of filter -> sheet targets
		let outputArray = [];
		// for (filterFieldName of filterFieldNameArray) {
		for (let i = 0; i < filterFieldNameArray.length; i++) {

			// filter on filterFieldName first
			let temp_filteredArray = filterInfoArray.filter(data => data.filterFieldName === filterFieldNameArray[i]);
			// then return array of targetWorksheets
			let temp_targetWorksheetArray = temp_filteredArray.map(data => data.targetWorksheet);
			// then return array of filterType
			let temp_filterTypeArray = temp_filteredArray.map(data => data.filterType);
			// then return array of filterDomainValues
			let temp_filterDomainValuesArray = temp_filteredArray.map(data => data.filterDomainValues);

			// create object to store values for filterFieldName, filterType, filterDomainValues and targetWorksheet
		  // then save to array
			outputArray.push({"filterFieldName" : filterFieldNameArray[i], "filterType" : temp_filterTypeArray[0], "filterDomainValues" : temp_filterDomainValuesArray[0], "targetWorksheet" : temp_targetWorksheetArray});

		}

		console.log("outputArray: ", outputArray);
    return outputArray;

  }

  async _getFilters(obj){
    const _this = this;
    return await obj.getFiltersAsync();
  }
}
