// filter library for the Tableau JS API
// author: Justin Crayraft
// email: jcraycraft@tableau.com

class TabFilters {

  constructor() {
    // future: option to add additional metadata (e.g. label, index, etc.) to filter values in order to satisfy any interesting 3rd-party UI button requirements
    this.option;
    this.embeddedVizzes = [];
    this.vizUpdateMode = {
      PAGE: "page",
      VIZ: "viz",
      SHEET: "sheet"
    };
    // simulate enum type
    Object.freeze(this.vizUpdateMode);
  }

  // filter discovery at initialization
  async discovery(viz, option) {
    let filters = [];
    let parameters = [];
    let embeddedViz = {};

    // future: filter events
    // this.filtersEventHistory = [];
    // this.filtersEvent = [];

    // future: on/off switch for "measure names" and "action" filter types
    // if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {
    // option for parameters discovery
    // option for parameters addEventListener

    // // update default options
    // this.option = $.extend({
    //   isFilterEventListenterEnabled: false,
    //   isFilterEventHistoryStored: false,
    //   isSessionFilterSelectionsStored: false,
    // }, option);


    // // en/disable filter events
    // if (this.option.isFilterEventListenterEnabled) {
    //   viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    // }

    // create embeddedViz object
    let vizObject = viz;
    let vizDomNode = vizObject.getParentElement();
    let vizUrl = vizObject.getUrl();
    let workbookObject = vizObject.getWorkbook();
    let workbookName = workbookObject.getName();
    let activeSheetObject = workbookObject.getActiveSheet();
    let activeSheetName = activeSheetObject.getName();
    let activeSheetType = activeSheetObject.getSheetType();

    embeddedViz = {
      vizObject: vizObject,
      vizDomNode: vizDomNode,
      vizUrl: vizUrl,
      workbookObject: workbookObject,
      workbookName: workbookName,
      activeSheetObject: activeSheetObject,
      activeSheetName: activeSheetName,
      activeSheetType: activeSheetType
    };

    // filters discovery
    let denormalizedFilters = [];
    switch (embeddedViz.activeSheetType) {
      case "worksheet":
        let worksheetObject = embeddedViz.activeSheetObject;
        let worksheetName = worksheetObject.getName();
        const rawfiltersArray = await this._getFilters(worksheetObject);
        for (let j = 0; j < rawfiltersArray.length; j++) {
          let filterObject = rawfiltersArray[j];
          let filterFieldName = filterObject.getFieldName();
          // don't capture "measure names" or "action" filter types
          if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {
            let filterWorksheetObject = {
              filterFieldName: filterFieldName,
              filterObject: filterObject,
              targetWorksheet: {
                targetVizName: activeSheetName,
                targetWorksheetName: worksheetName,
                targetWorksheetObject: worksheetObject
              }
            };
            denormalizedFilters.push(filterWorksheetObject);
          }
        }
        break;

      case "dashboard":
        let dashboardObjects = embeddedViz.activeSheetObject.getObjects();
        for (let i = 0; i < dashboardObjects.length; i++) {
          let sheetObject = dashboardObjects[i];
          let sheetObjectType = sheetObject.getObjectType();
          if (sheetObjectType == 'worksheet') {
            let worksheetObject = sheetObject.getWorksheet();
            let worksheetName = worksheetObject.getName();
            const rawfiltersArray = await this._getFilters(worksheetObject);
            for (let j = 0; j < rawfiltersArray.length; j++) {
              let filterObject = rawfiltersArray[j];
              let filterFieldName = filterObject.getFieldName();
              // don't capture "measure names" or "action" filter types
              if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {
                let filterWorksheetObject = {
                  filterFieldName: filterFieldName,
                  filterObject: filterObject,
                  targetWorksheet: {
                    targetVizName: activeSheetName,
                    targetWorksheetName: worksheetName,
                    targetWorksheetObject: worksheetObject
                  }
                };
                denormalizedFilters.push(filterWorksheetObject);
              }
            }
          }
        }
        break;

    }

    // console.log("denormalizedFilters @ 126", denormalizedFilters);

    // future: if filterAreAllValuesSelected === 'false', then try to clone viz in hidden div, apply all filters and get domain values
    let filterFieldNames = denormalizedFilters.map(data => data.filterFieldName);
    let filterFieldNamesUnique = [...new Set(filterFieldNames)];
    // loop through unique filterFieldNameArray and return normalized array of filter -> sheet targets
    for (let i = 0; i < filterFieldNamesUnique.length; i++) {
      // filter on filterFieldName
      let temp_filteredArray = denormalizedFilters.filter(data => data.filterFieldName === filterFieldNamesUnique[i]);
      // then return array of targetWorksheets
      // have this worksheet object include the parentViz
      let temp_targetWorksheetArray = temp_filteredArray.map(data => data.targetWorksheet);
      // then return array of filterType
      let temp_filterTypeArray = temp_filteredArray.map(data => data.filterType);
      let temp_filterObjectArray = temp_filteredArray.map(data => data.filterObject);
      let tempNewFilterInfoObj = {
        filterFieldName: filterFieldNamesUnique[i]
      };
      tempNewFilterInfoObj.filterObject = temp_filterObjectArray[0];
      tempNewFilterInfoObj.filterFieldType = tempNewFilterInfoObj.filterObject.getFilterType();
      tempNewFilterInfoObj.targetWorksheets = temp_targetWorksheetArray;

      switch (tempNewFilterInfoObj.filterFieldType) {

        case 'categorical':
          tempNewFilterInfoObj.filterAreAllValuesSelected = tempNewFilterInfoObj.filterObject.getIsAllSelected();
          if (tempNewFilterInfoObj.filterObject.getAppliedValues() === null) {
            tempNewFilterInfoObj.filterDomainValues = null;
            filters.push(tempNewFilterInfoObj);
          } else {
            let temp_uniqueValues = [];
            for (let n = 0; n < tempNewFilterInfoObj.filterObject.getAppliedValues().length; n++) {
              temp_uniqueValues.push({
                id: n,
                text: tempNewFilterInfoObj.filterObject.getAppliedValues()[n].formattedValue,
                tableauRawValue: tempNewFilterInfoObj.filterObject.getAppliedValues()[n].value
              });
            }
            tempNewFilterInfoObj.filterDomainValues = temp_uniqueValues;
            filters.push(tempNewFilterInfoObj);
          }
          break;

        case 'quantitative':
          let temp_domainMax = tempNewFilterInfoObj.filterObject.getDomainMax();
          let temp_domainMin = tempNewFilterInfoObj.filterObject.getDomainMin();
          let temp_max = tempNewFilterInfoObj.filterObject.getMax();
          let temp_min = tempNewFilterInfoObj.filterObject.getMin();
          let temp_includeNullValues = tempNewFilterInfoObj.filterObject.getIncludeNullValues();
          tempNewFilterInfoObj.filterDomainMax = temp_domainMax;
          tempNewFilterInfoObj.filterDomainMin = temp_domainMin;
          tempNewFilterInfoObj.filterMax = temp_max;
          tempNewFilterInfoObj.filterMin = temp_min;
          tempNewFilterInfoObj.filterIncludeNullValues = temp_includeNullValues;
          filters.push(tempNewFilterInfoObj);
          break;

        case 'relativedate':
          let temp_period = tempNewFilterInfoObj.filterObject.getPeriod();
          let temp_range = tempNewFilterInfoObj.filterObject.getRange();
          let temp_rangeN = tempNewFilterInfoObj.filterObject.getRangeN();
          tempNewFilterInfoObj.filterPeriod = temp_period;
          tempNewFilterInfoObj.filterRange = temp_range;
          tempNewFilterInfoObj.filterRangeN = temp_rangeN;
          filters.push(tempNewFilterInfoObj);
          break;

      }

    }

    // parameters discovery
    const parametersArray = await this._getParameters(workbookObject);

    for (let i = 0; i < parametersArray.length; i++) {
      let parameterMinValue = null;
      let parameterMaxValue = null;
      let parameterStepSize = null;
      let parameterStepPeriod = null;
      let parameterObject = parametersArray[i];
      let parameterCurrentValue = parametersArray[i].getCurrentValue();
      let parameterName = parametersArray[i].getName();
      let parameterDataType = parametersArray[i].getDataType();
      let parameterAllowableValuesType = parametersArray[i].getAllowableValuesType();
      let parameterAllowableValues = parametersArray[i].getAllowableValues();


      if (parameterAllowableValuesType === "range") {
        parameterMinValue = parametersArray[i].getMinValue();
        parameterMaxValue = parametersArray[i].getMaxValue();
        parameterStepSize = parametersArray[i].getStepSize();
        if (parameterDataType === "date" || parameterDataType === "datetime") {
          parameterStepPeriod = parametersArray[i].getDateStepPeriod();
        }

      }

      parameters.push({
        parameterObject: parameterObject,
        parameterCurrentValue: parameterCurrentValue,
        parameterName: parameterName,
        parameterDataType: parameterDataType,
        parameterAllowableValuesType: parameterAllowableValuesType,
        parameterAllowableValues: parameterAllowableValues,
        parameterMinValue: parameterMinValue,
        parameterMaxValue: parameterMaxValue,
        parameterStepSize: parameterStepSize,
        parameterStepPeriod: parameterStepPeriod,
        targetWorkbook: {
          targetWorkbookName: workbookName,
          targetWorkbookObject: workbookObject
        }
      });

    }



    embeddedViz.parameters = parameters;
    embeddedViz.filters = filters;
    this.embeddedVizzes.push(embeddedViz);
    return this;

  }

  // future: add eventlistner on/off switch
  // updateOption(option) {
  //   this.option = $.extend(this.option, option);
  //   // toggle event listener
  //   if (this.option.isFilterEventListenterEnabled) {
  //     viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
  //   } else {
  //     viz.removeEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
  //   }
  //   return this;
  //
  // }


  async applyParameters(parameterObj) {

    let i;
    let j;
    let promise;
    let promiseArray = [];
    let parameterArray = [];
    let vizArray = [];
    let innerArray = [];
    let outerArray = [];


    switch (parameterObj.scope.mode) {

      case this.vizUpdateMode.PAGE:
        for (j = 0; j < this.embeddedVizzes.length; j++) {
          parameterArray = this.embeddedVizzes[j].parameters.filter(p => p.parameterName === parameterObj.parameter.parameterName);
          innerArray.push(parameterArray[0].targetWorkbook.targetWorkbookObject);
        }
        outerArray = outerArray.concat(innerArray);
        innerArray = [];
        break;

      case this.vizUpdateMode.VIZ:
        for (i = 0; i < parameterObj.scope.targetArray.length; i++) {
          vizArray = this.embeddedVizzes.filter(v => v.activeSheetName === parameterObj.scope.targetArray[i]);
          for (j = 0; j < vizArray.length; j++) {
            parameterArray = vizArray[j].parameters.filter(p => p.parameterName === parameterObj.parameter.parameterName);
            innerArray.push(parameterArray[0].targetWorkbook.targetWorkbookObject);
          }
          outerArray = outerArray.concat(innerArray);
          innerArray = [];
        }
        break;

    }

    for (i = 0; i < outerArray.length; i++) {
      promise = outerArray[i].changeParameterValueAsync(parameterObj.parameter.parameterName, parameterObj.parameter.values);
      promiseArray.push(promise);
    }

    const data = await Promise.all(promiseArray);
    // console.log("data", data);

  }


  // future: need to add all the appropriate filter-type options
  async applyFilters(filterObj) {
    let filterToApplyArray = [];
    let filter = [];
    let i;
    let j;
    let filterType;
    let promiseArray = [];

    // route filter update by scope.mode (PAGE, VIZ OR SHEET)
    switch (filterObj.scope.mode) {
      case this.vizUpdateMode.PAGE:
        // applies the filter value globally to all vizzes; i.e. every worksheet on the page that includes the filter
        for (i = 0; i < this.embeddedVizzes.length; i++) {
          filter = this.embeddedVizzes[i].filters.filter(filter => filter.filterFieldName === filterObj.filter.fieldName);
          if (filter.length === 1) {
            // if we find matching filter, then add to filterToApplyArray
            filterType = filter[0].filterFieldType;
            filterToApplyArray.push(filter[0]);
          }
        }
        // future: add some error handling
        // if (filterToApplyArray.length === 0) {
        //   console.error("Can't find a filter called:", filterObj.filter.fieldName);
        // }
        break;

      case this.vizUpdateMode.VIZ:
        // applies the filter value globally to the specificied viz; e.g. every worksheet in the viz that includes the filter
        for (i = 0; i < filterObj.scope.targetArray.length; i++) {
          let viz = this.embeddedVizzes.filter(v => v.activeSheetName === filterObj.scope.targetArray[i]);
          if (viz.length === 1) {
            // if it found viz, then do this block
            filter = viz[0].filters.filter(filter => filter.filterFieldName === filterObj.filter.fieldName);
            // console.log("filter @ #247", filter);
            if (filter.length === 1) {
              // if we find matching filter, then add to filterToApplyArray
              filterType = filter[0].filterFieldType;
              filterToApplyArray.push(filter[0]);
            }
          }
        }
        break;

      case this.vizUpdateMode.SHEET:
        // applies the filter value to specified viz and worksheet(s) combination
        for (i = 0; i < filterObj.scope.targetArray.length; i++) {
          // filter on viz
          let viz = this.embeddedVizzes.filter(v => v.activeSheetName === filterObj.scope.targetArray[i].viz);
          if (viz.length === 1) {
            // if it found viz, then do this block
            // filter on fieldName
            let filter = viz[0].filters.filter(filter => filter.filterFieldName === filterObj.filter.fieldName);
            // filter on sheets
            if (filter.length === 1) {
              // if we find matching filter, proceed
              let targetWorksheetsArray_temp = [];
              for (j = 0; j < filterObj.scope.targetArray[i].sheetsArray.length; j++) {
                let sheets = filter[0].targetWorksheets.filter(ws => ws.targetWorksheetName === filterObj.scope.targetArray[i].sheetsArray[j]);
                if (sheets.length === 1) {
                  // if we find matching filter, add to array
                  targetWorksheetsArray_temp.push(sheets[0]);
                }
              }

              if (targetWorksheetsArray_temp.length > 0) {
                // finally, if we found at least one matching sheet, add to filterToApplyArray
                filter[0].targetWorksheets = targetWorksheetsArray_temp;
                filterType = filter[0].filterFieldType;
                filterToApplyArray.push(filter[0]);

              }

            }

          }
        }

        break;
    }


    // note that tableau.FilterUpdateType Enum only includes: {ALL: "all", REPLACE: "replace", ADD: "add", REMOVE: "remove"}
    // I'm including an updateType of "clear" and routing those to clearFilterAsync(fieldName: string) which is supported for all filter types (categorical, quantitative, hierarchical and relativedate)
    if (filterObj.filter.updateType === 'clear') {

      for (i = 0; i < filterToApplyArray.length; i++) {
        let filterToApply = filterToApplyArray[i];
        let promise = this._sendClearFilters(filterToApply, filterObj.filter.values);
        promiseArray.push(promise);
      }

    } else {
      // route the filters by filterType
      switch (filterType) {
        case "categorical":
          this._sendCategoricalFilters(filterToApplyArray, filterObj.filter.updateType, filterObj.filter.values);
          break;

        case "quantitative":
          this._sendRangeFilters(filterToApplyArray, filterObj.filter.values);
          break;

        case "relativedate":
          this._sendRelativeDateFilters(filterToApplyArray, filterObj.filter.values);
          break;

        case "hierarchical":
          // future: test this with cube data as this is not intended for relational data structures
          // also, per online help, the filter values require the full hierarchical name (e.g. [Product].[All Product].[Espresso])
          // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_filtering.htm
          this._sendHierarchicalFilters(filterToApplyArray, filterObj.filter.updateType, filterObj.filter.values);
          break;
      }

    }
    // https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel

  }

  // *** NEED TO ADD ALL OPTIONS, NULL STUFF, INCLUDE/EXCLUDE -- SEE ONLINE HELP ****

  // internal/helper function to clear Tableau filters
  async _sendClearFilters(filterToApplyArray) {
    let j;
    let i;
    let promise;
    let promiseInnerArray = [];
    let promiseOuterArray = [];

    for (i = 0; i < filterToApplyArray.length; i++) {

      for (j = 0; j < filterToApplyArray[i].targetWorksheets.length; j++) {
        promise = filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.clearFilterAsync(filterToApplyArray[i].filterFieldName);
        promiseInnerArray.push(promise);
      }
      promiseOuterArray = promiseOuterArray.concat(promiseInnerArray);
      promiseInnerArray = [];

    }

    const data = await Promise.all(promiseOuterArray);
    // console.log("data", data);

  }

  // internal/helper function to send Categorical filters to Tableau
  // supports tableau.FilterUpdateType
  async _sendCategoricalFilters(filterToApplyArray, updateType, values) {
    let j;
    let i;
    let promise;
    let promiseInnerArray = [];
    let promiseOuterArray = [];

    for (i = 0; i < filterToApplyArray.length; i++) {

      for (j = 0; j < filterToApplyArray[i].targetWorksheets.length; j++) {
        promise = filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, updateType);
        promiseInnerArray.push(promise);
      }
      promiseOuterArray = promiseOuterArray.concat(promiseInnerArray);
      promiseInnerArray = [];

    }

    const data = await Promise.all(promiseOuterArray);
    // console.log("data", data);

  }

  // internal/helper function to send Range filters Tableau
  async _sendRangeFilters(filterToApplyArray, values) {
    let j;
    let i;
    let promise;
    let promiseInnerArray = [];
    let promiseOuterArray = [];

    for (i = 0; i < filterToApplyArray.length; i++) {

      for (j = 0; j < filterToApplyArray[i].targetWorksheets.length; j++) {
        promise = filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values);
        promiseInnerArray.push(promise);
      }
      promiseOuterArray = promiseOuterArray.concat(promiseInnerArray);
      promiseInnerArray = [];

    }

    const data = await Promise.all(promiseOuterArray);
    // console.log("data", data);

  }

  // internal/helper function to send Relative Date filters to Tableau
  async _sendRelativeDateFilters(filterToApplyArray, values) {
    let j;
    let i;
    let promise;
    let promiseInnerArray = [];
    let promiseOuterArray = [];


    for (i = 0; i < filterToApplyArray.length; i++) {

      for (j = 0; j < filterToApplyArray[i].targetWorksheets.length; j++) {
        promise = filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values);
        promiseInnerArray.push(promise);
      }
      promiseOuterArray = promiseOuterArray.concat(promiseInnerArray);
      promiseInnerArray = [];

    }

    const data = await Promise.all(promiseOuterArray);
    // console.log("data", data);

  }

  // internal/helper function to send Hierarchical filters to Tableau
  // supports tableau.FilterUpdateType
  async _sendHierarchicalFilters(filterToApplyArray, updateType, values) {
    let j;
    let i;
    let promise;
    let promiseInnerArray = [];
    let promiseOuterArray = [];


    for (i = 0; i < filterToApplyArray.length; i++) {

      for (j = 0; j < filterToApplyArray[i].targetWorksheets.length; j++) {
        promise = filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, updateType);
        promiseInnerArray.push(promise);
      }
      promiseOuterArray = promiseOuterArray.concat(promiseInnerArray);
      promiseInnerArray = [];

    }

    const data = await Promise.all(promiseOuterArray);
    // console.log("data", data);

  }

  // internal/helper function to retrieve filters from Tableau JS API
  async _getFilters(obj) {
    const _this = this;
    return await obj.getFiltersAsync();
  }

  // internal/helper function to retrieve the filters from Tableau JS API (notice: getFilterAsync is singular; this is for getting filter values from Tableau filter event)
  async _getFilterFromEvent(obj) {
    const _this = this;
    // add the filterObject onto the normalizedFilters as the last filterObject update / state
    return await obj.getFilterAsync();
  }

  // internal/helper function to retrieve the parameters from Tableau JS API
  async _getParameters(obj) {
    return await obj.getParametersAsync();
  }

}