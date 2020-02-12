// filter class to fetch filter metadata from Tableau JS API
// author: Justin Crayraft

class TabFilters {

  constructor(viz, option) {

    // add measure names and action filter options
    // if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {
    // toggle logic at line 64 to improve performance / limit requests if not needed
    // option for parameters discovery
    // option for parameters addEventListener

    this.option = $.extend({
      enableFilterEventListenter: true,
      nextProperty: "blah"
    }, option);

    console.log("this.option", this.option);

    this.wb = viz.getWorkbook();
    this.activeSheet = this.wb.getActiveSheet();
    this.activeSheetName = this.activeSheet.getName();
    this.activeSheetType = this.activeSheet.getSheetType();
    this.denormalizedFilters = [];
    this.normalizedFilters = [];
    this.parameters = [];
    // add config option to en/disable filter event listner
    this.filtersEvent = [];
    // viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    // this.filtersEventHistory = [];
    window.filtersEventHistory = [];


    if (this.option.enableFilterEventListenter) {
      viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));

    }


  }

  updateOption(option) {
    this.option = $.extend(this.option, option);

    if (this.option.enableFilterEventListenter) {
      console.log("option update: added event listener");
      viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));

    } else {
      console.log("option update: removed event listener");
      return viz.removeEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    }

  }

  // filter discovery at initialization
  async init() {

    // parameters discovery
    const parametersArray = await this._getParameters(this.wb);
    console.log("parametersArray", parametersArray);

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
          console.log("datetime parameter", parameterName);
          parameterStepPeriod = parametersArray[i].getDateStepPeriod();
        }

      }

      this.parameters.push({
        parameterObject: parameterObject,
        parameterCurrentValue: parameterCurrentValue,
        parameterName: parameterName,
        parameterDataType: parameterDataType,
        parameterAllowableValuesType: parameterAllowableValuesType,
        parameterAllowableValues: parameterAllowableValues,
        parameterMinValue: parameterMinValue,
        parameterMaxValue: parameterMaxValue,
        parameterStepSize: parameterStepSize,
        parameterStepPeriod: parameterStepPeriod
      });

    }

    // filters discovery
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

            // *** Fix this: remove the quotation marks on the properties *** -- do this througout this file
            let filterWorksheetObject = {
              "filterFieldName": filterFieldName,
              "filterObject": filterObject,
              "targetWorksheet": {
                "targetWorksheetName": worksheetName,
                "targetWorksheetObject": worksheetObject
              }
            };
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

                let filterWorksheetObject = {
                  "filterFieldName": filterFieldName,
                  "filterObject": filterObject,
                  "targetWorksheet": {
                    "targetWorksheetName": worksheetName,
                    "targetWorksheetObject": worksheetObject
                  }
                };
                this.denormalizedFilters.push(filterWorksheetObject);
              }
            }
          }
        }

        break;

    }

    // ***improve in the future; if filterAreAllValuesSelected === 'false', then use clone in hidden div or 0px x 0px to apply all filters and get allvalues and update existing object
    // filters could be cascading or dependent, so have to apply all values to all filters, then go back and get filters (use the updateALL filter updateType)
    // return array of unique filterFieldName
    let filterFieldNames = this.denormalizedFilters.map(data => data.filterFieldName);
    let filterFieldNamesUnique = [...new Set(filterFieldNames)];
    // console.log("filterFieldNamesUnique", filterFieldNamesUnique);

    // then loop through unique filterFieldNameArray and return normalized array of filter -> sheet targets
    for (let i = 0; i < filterFieldNamesUnique.length; i++) {

      // filter on filterFieldName first
      let temp_filteredArray = this.denormalizedFilters.filter(data => data.filterFieldName === filterFieldNamesUnique[i]);
      // then return array of targetWorksheets
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
          // console.log("debug info - filterFieldName:", filterFieldNamesUnique[i]);
          if (tempNewFilterInfoObj.filterObject.getAppliedValues() === null) {
            tempNewFilterInfoObj.filterDomainValues = null;
            this.normalizedFilters.push(tempNewFilterInfoObj);

          } else {
            let temp_uniqueValues = [];
            for (let n = 0; n < tempNewFilterInfoObj.filterObject.getAppliedValues().length; n++) {

              temp_uniqueValues.push({
                "id": n,
                "text": tempNewFilterInfoObj.filterObject.getAppliedValues()[n].formattedValue,
                "tableauRawValue": tempNewFilterInfoObj.filterObject.getAppliedValues()[n].value
              });
            }

            tempNewFilterInfoObj.filterDomainValues = temp_uniqueValues;
            this.normalizedFilters.push(tempNewFilterInfoObj);
          }

          break;

        case 'quantitative':

          let temp_domainMax = tempNewFilterInfoObj.filterObject.getDomainMax();
          let temp_domainMin = tempNewFilterInfoObj.filterObject.getDomainMin();
          tempNewFilterInfoObj.filterDomainMax = temp_domainMax;
          tempNewFilterInfoObj.filterDomainMin = temp_domainMin;
          this.normalizedFilters.push(tempNewFilterInfoObj);

          break;

      }

    }

    return this;

  }

  justin() {
    console.log("called method justin from another method");

  }

  async onFilterSelection(filtersEvent) {
    // const _this = this;
    console.log("filter change!");
    this.justin();
    let filterEventViz = filtersEvent.getViz();
    let filterEventWorksheet = filtersEvent.getWorksheet();
    let filterEvent = filtersEvent.getEventName();
    let filterEventFieldName = filtersEvent.getFieldName();


    console.log("filtersEvent", filtersEvent);

    console.log("filtersEvent.getViz():", filtersEvent.getViz());
    console.log("filtersEvent.getEventName():", filtersEvent.getEventName());
    console.log("filtersEvent.getFieldName():", filtersEvent.getFieldName());

    const filtersFromEvent = await this._getFilters(filterEventWorksheet);
    // now go get all the metadata for the filter (applied values, excludeMode, allSelected, etc.)
    // only store single entry for each unique filterEventFieldName (which is one because it only fires per filter event)
    // normalize the "target" worksheets like in the init()
    // consider storing an array so that users can click the Play/Rewind button - currently doing this
    // or just save over top of last entry - config option
    // create the object empty object in the init()
    // empty object includes stub out for each filterFieldName
    // see above


    console.log("this", this);
    this.filtersEvent.push({
      filterEventViz: filterEventViz,
      filterEventWorksheet: filterEventWorksheet,
      filterEvent: filterEvent,
      filterEventFieldName: filterEventFieldName,
      filtersFromEvent: filtersFromEvent
    });
    // window.filtersEventHistory.push("justin testing!!");
    // console.log("window.filtersEventHistory", window.filtersEventHistory);
    // return this;
  }

  // function onFilterSelection(filtersEvent) {
  //   // const _this = this;
  //   console.log("filter change!");
  //   // filtersEvent.getViz();
  //   // console.log("filtersEvent.getViz():", filtersEvent.getViz());
  //   // filtersEvent.getEventName();
  //   // console.log("filtersEvent.getEventName():", filtersEvent.getEventName());
  //   // filtersEvent.getFieldName();
  //   // console.log("filtersEvent.getFieldName():", filtersEvent.getFieldName());
  //   // // return filtersEvent.getFilterAsync().then(reportSelectedFilters);
  //   // filtersEvent.getFilterAsync().then(function(filterSelected) {
  //   //   console.log("filterSelected:", filterSelected);
  //   // });
  //
  // }

  async getParametersValues_Testing() {
    // parameters discovery
    const parametersArray = await this._getParameters(this.wb);
    console.log("parametersArray:", parametersArray);
    for (let i = 0; i < parametersArray.length; i++) {
      let parameterObject = parametersArray[i];
      let parameterValue = parametersArray[i].getCurrentValue();
      let parameterName = parametersArray[i].getName();
      this.parameters.push({
        "parameterObject": parameterObject,
        "parameterCurrentValue": parameterValue,
        "parameterName": parameterName
      });
      console.log("parameterName", parameterName);
      console.log("parameterValue", parameterValue);


    }
    return this;
  }


  async applyParameterValues_Testing(parameterName, value) {
    return await this.wb.changeParameterValueAsync(parameterName, value);

  }




  // // get current value for specific parameter
  //   async getParametersValues(parameterName) {
  //
  //     let index = this.parameters.findIndex(parameter => parameter.parameterName === parameterName);
  //     // let index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //       console.log("parameters:", parameters);
  //
  //       parameters.forEach(function(parameter) {
  //         let parameterValue = parameter.getCurrentValue();
  //         console.log("parameterValue", parameterValue);
  //
  //       });
  //
  //       return parameters;
  //
  //
  //   }

  // function getFilterCurrentValues(filterFieldName) {
  //   let index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //   console.log("index", index);
  //   console.log("filterObject", this.normalizedFilters[index]);
  //   let values = this.normalizedFilters[index].filterObject.getAppliedValues();
  //   console.log("filterFieldName", filterFieldName);
  //   console.log("values", values);
  // }



  async applyCategoricalFilters(updateType, filterFieldName, values) {
    const _this = this;
    switch (updateType) {

      case 'REPLACE':


        let index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

        let i;
        for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
          this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
        }
        return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
        break;

      case 'CLEAR':

        for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
          this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.clearFilterAsync(this.normalizedFilters[index].filterFieldName);
        }
        return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.clearFilterAsync(this.normalizedFilters[index].filterFieldName);
        break;

    }
  }


  // async applyFilters_Test(filterFieldName, filterType, updateType, values) {
  //   const _this = this;
  //   let index;
  //   let i;
  //
  //     switch (filterType) {
  //
  //       case "categorical":
  //         applyCategoricalFilters(filterFieldName, updateType, values);
  //       case "quantitative":
  //         applyQuantitativeFilters(filterFieldName, updateType, values);


  // *** NEED TO ADD ALL OPTIONS, NULL STUFF, INCLUDE/EXCLUDE -- SEE ONLINE HELP ****

  async applyFilters(filterFieldName, filterType, updateType, values) {
    const _this = this;
    let index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);
    let i;

    if (updateType === 'CLEAR') {
      for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
        this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.clearFilterAsync(this.normalizedFilters[index].filterFieldName);
      }
      return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.clearFilterAsync(this.normalizedFilters[index].filterFieldName);

    } else {

      switch (filterType) {

        case "categorical":

          switch (updateType) {

            case 'ALL':

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              break;

            case 'REPLACE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              break;

            case 'ADD':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              break;

            case 'REMOVE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              break;

          }
          break;

        case "quantitative":

          switch (updateType) {

            case 'ALL':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              break;

            case 'REPLACE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              break;

            case 'ADD':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              break;

            case 'REMOVE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRangeFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              break;

          }
          break;

        case "hierarchical":

          switch (updateType) {

            case 'ALL':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              break;

            case 'REPLACE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              break;

            case 'ADD':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              break;

            case 'REMOVE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyHierarchicalFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              break;

          }
          break;

        case "relative_date":

          switch (updateType) {

            case 'ALL':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ALL);
              break;

            case 'REPLACE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              break;

            case 'ADD':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.ADD);
              break;

            case 'REMOVE':

              // index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
                this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              }
              return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyRelativeDateFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              break;

          }
          break;

      }

    }

  }

  // method to apply filter values
  // this works (filtering)
  async applyFilters1(filterFieldName, values) {
    const _this = this;
    let index = this.normalizedFilters.findIndex(filter => filter.filterFieldName === filterFieldName);
    let i;
    for (i = 0; i < this.normalizedFilters[index].targetWorksheets.length - 1; i++) {
      this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
    }
    return await this.normalizedFilters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.normalizedFilters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  }

  // this is more efficient because I don't have to retrieve item via index (search array) each time
  // this doesn't work (creating copy of object); returns undefined
  // method to apply filter values
  async applyFilters2(filterFieldName, values) {
    let filterToApply = this.normalizedFilters.filter(filter => filter.filterFieldName == filterFieldName);
    filterToApply = filterToApply[0];
    // console.log("filterToApply:", filterToApply[0]);
    console.log("filterToApply:", filterToApply);
    // console.log("filterToApply[0].targetWorksheets:", filterToApply[0].targetWorksheets);
    console.log("filterToApply[0].targetWorksheets:", filterToApply.targetWorksheets);
    let i;

    for (i = 0; i < filterToApply.targetWorksheets.length - 1; i++) {
      filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
    }
    return await filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);


    // for (i = 0; i < filterToApply[0].targetWorksheets.length - 1; i++) {
    //   filterToApply[0].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply[0].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
    // }
    // return await filterToApply[0].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply[0].filterFieldName, values, tableau.FilterUpdateType.REPLACE);

  }


  getParameterValues(parameterName) {
    // let filterToApply = this.normalizedFilters.filter(filter => filter.filterFieldName == filterFieldName);
    let parameter = this.parameters.filter(parameter => parameter.parameterName == parameterName);
    console.log("parameter", parameter);
    parameter = parameter[0];
    let value = parameter.parameterObject.getCurrentValue();
    console.log("current value:", value);
    return value;
  }

  // it's a property so you have to fetch the parameter object again
  // will have to try this with the filters object and see if behavior matches
  async getParameterValuesAgain(parameterName) {

    let newParameter = [];
    // parameters discovery
    const parametersArray = await this._getParameters(this.wb);
    // console.log("parametersArray", parametersArray);
    // let parameter = this.parameters.filter(parameter => parameter.parameterName == parameterName);
    // console.log("parameter", parameter);
    // parameter = parameter[0];

    for (let i = 0; i < parametersArray.length; i++) {
      let parameterObject = parametersArray[i];
      let parameterCurrentValue = parametersArray[i].getCurrentValue();
      console.log(parameterCurrentValue);
      let parameterName = parametersArray[i].getName();
      console.log(parameterName);
      newParameter.push({
        parameterObject: parameterObject,
        parameterCurrentValue: parameterCurrentValue,
        parameterName: parameterName
      });

    }
    return newParameter;
  }

  // method to get filters for specified type of filter (e.g. categorical, quantitative, hierarchical, relative_date)
  getFiltersByType(type) {
    let filteredFilters = this.normalizedFilters.filter(obj => obj.filterFieldType === type);
    return filteredFilters;
  }

  // var getFiltersByType = function (type){
  //
  //
  // }

  // internal/helper function to retrieve the filter object for a tableau worksheet
  async _getFilters(obj) {
    const _this = this;
    return await obj.getFiltersAsync();
  }

  // internal/helper function to retrieve the filter object for a tableau worksheet
  async _getFilterFromEvent(obj) {
    const _this = this;
    // add the filterObject onto the normalizedFilters as the last filterObject update / state
    return await obj.getFilterAsync();
  }

  // internal/helper function to retrieve the parameters object for a tableau workbook
  async _getParameters(obj) {
    const _this = this;
    return await obj.getParametersAsync();
  }

}