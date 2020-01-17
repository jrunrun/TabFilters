// filter class to fetch filter metadata from Tableau JS API


class TabFilters {

	constructor(viz){
		this.wb = viz.getWorkbook();
		this.activeSheet = this.wb.getActiveSheet();
		this.activeSheetName = this.activeSheet.getName();
		this.activeSheetType = this.activeSheet.getSheetType();
    this.denormalizedFilters = [];
		this.normalizedFilters = [];

	}

  // filter discovery at initialization
  async init(){
	  switch (this.activeSheetType) {

      case "worksheet":
				console.log("the activeSheet is a worksheet");
				let worksheetObject = this.activeSheet;
				let worksheetName = worksheetObject.getName();
				const filters = await this._getFilters(worksheetObject);

				for (let j = 0; j < filters.length; j++) {
					let filterObject = filters[j];
					let filterFieldName = filterObject.getFieldName();

					if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {

						let filterWorksheetObject = {"filterFieldName" : filterFieldName, "filterObject" : filterObject, "targetWorksheet" : {"targetWorksheetName" : worksheetName, "targetWorksheetObject" : worksheetObject}};
						this.denormalizedFilters.push(filterWorksheetObject);
					}
				}

        break;

      case "dashboard":
				console.log("the activeSheet is a dashboard");
			  let dashboardObjects = this.activeSheet.getObjects();

				for (let i = 0; i < dashboardObjects.length; i++) {
					let sheetObject = dashboardObjects[i];
					let sheetObjectType = sheetObject.getObjectType();

					if (sheetObjectType == 'worksheet') {
					  let worksheetObject = sheetObject.getWorksheet();
						let worksheetName = worksheetObject.getName();
					  const filters = await this._getFilters(worksheetObject);

						for (let j = 0; j < filters.length; j++) {
							let filterObject = filters[j];
							let filterFieldName = filterObject.getFieldName();

							if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {

								let filterWorksheetObject = {"filterFieldName" : filterFieldName, "filterObject" : filterObject, "targetWorksheet" : {"targetWorksheetName" : worksheetName, "targetWorksheetObject" : worksheetObject}};
								this.denormalizedFilters.push(filterWorksheetObject);
							}
						}
			  }
    }

		break;

	}

	// return array of unique filterFieldName
	let filterFieldNames = this.denormalizedFilters.map(data => data.filterFieldName);
	let filterFieldNamesUnique = [... new Set(filterFieldNames)];
	console.log("filterFieldNamesUnique", filterFieldNamesUnique);

	// then loop through unique filterFieldNameArray and return normalized array of filter -> sheet targets
	for (let i = 0; i < filterFieldNamesUnique.length; i++) {

		// filter on filterFieldName first
		let temp_filteredArray = this.denormalizedFilters.filter(data => data.filterFieldName === filterFieldNamesUnique[i]);
		// then return array of targetWorksheets
		let temp_targetWorksheetArray = temp_filteredArray.map(data => data.targetWorksheet);
		// then return array of filterType
		let temp_filterTypeArray = temp_filteredArray.map(data => data.filterType);
		let temp_filterObjectArray = temp_filteredArray.map(data => data.filterObject);

		let tempNewFilterInfoObj = {filterFieldName : filterFieldNamesUnique[i]};

		tempNewFilterInfoObj.filterObject = temp_filterObjectArray[0];
		tempNewFilterInfoObj.filterFieldType = tempNewFilterInfoObj.filterObject.getFilterType();
		tempNewFilterInfoObj.targetWorksheets = temp_targetWorksheetArray;

		// add logic for different filter types supported by Tableau JS API (categorical, quantitative, hierarchical, relative_date)
		let temp_uniqueValues = [];
		for (let n = 0; n < tempNewFilterInfoObj.filterObject.getAppliedValues().length; n++){

			temp_uniqueValues.push({"id" : n, "text" : tempNewFilterInfoObj.filterObject.getAppliedValues()[n].formattedValue, "tableauRawValue" : tempNewFilterInfoObj.filterObject.getAppliedValues()[n].value});
		}

		tempNewFilterInfoObj.filterDomainValues = temp_uniqueValues;
		this.normalizedFilters.push(tempNewFilterInfoObj);

 }

	// temporary -- testing
	let filterFieldName = 'Region';
	let tempFilters = this.normalizedFilters.filter(filter => filter.filterFieldName === filterFieldName);
	console.log("tempFilters:", tempFilters);
	return this;

}

		// method to apply filter values
		async applyFilters(filterFieldName, values){
			const _this = this;
			let filterToApply = this.normalizedFilters.filter(filter => filter.filterFieldName === filterFieldName);
			for (i = 0; i < filterToApply.targetWorksheets.length - 1; i++){
				filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
			}
			return await filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
		}

		// method to clear all filter values
		async clearFilters(filterFieldName){
			const _this = this;
			let filterToApply = this.normalizedFilters.filter(filter => filter.filterFieldName === filterFieldName);
			for (let i = 0; i < filterToApply.targetWorksheets.length - 1; i++){
          filterToApply.targetWorksheets[i].targetWorksheetObject.clearFilterAsync(filterToApply.filterFieldName);
        }
        return filterToApply.targetWorksheets[i].targetWorksheetObject.clearFilterAsync(filterToApply.filterFieldName);
		}

		// method to get filters for specified type of filter (e.g. categorical, quantitative, hierarchical, relative_date)
		getFiltersByType(type) {
		  let filteredFilters = this.normalizedFilters.filter(obj => obj.filterFieldType === type);
			return filteredFilters;
		}

		// internal/helper function to retrieve the filter object for a tableau worksheet
		async _getFilters(obj){
			const _this = this;
			return await obj.getFiltersAsync();
		}

}
