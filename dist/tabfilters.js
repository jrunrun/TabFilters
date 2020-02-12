// filter library to interface the Tableau JS API
// author: Justin Crayraft
// email: jcraycraft@tableau.com

class TabFilters {

  constructor() {
    this.option;
    this.embeddedVizzes = [];
    this.vizUpdateMode = {
      ALL: "all",
      VIZ: "viz",
      SHEETS: "sheets"
    };

  }



  // filter discovery at initialization
  async discovery(viz, option) {
    let filters = [];
    let embeddedViz = {};

    // future: filter events
    // this.filtersEventHistory = [];
    // this.filtersEvent = [];

    // add measure names and action filter options
    // if (filterFieldName.toLowerCase() != "measure names" && filterFieldName.toLowerCase().includes("action") == false) {
    // option for parameters discovery
    // option for parameters addEventListener

    // update default options
    this.option = $.extend({
      isFilterEventListenterEnabled: false,
      isFilterEventHistoryStored: false,
      isSessionFilterSelectionsStored: false,
    }, option);


    // en/disable filter events
    if (this.option.isFilterEventListenterEnabled) {
      viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    }

    // create embeddedViz object
    let vizObject = viz;
    let vizDomNode = vizObject.getParentElement();
    let vizUrl = vizObject.getUrl();
    let workbookObject = vizObject.getWorkbook();
    let activeSheetObject = workbookObject.getActiveSheet();
    let activeSheetName = activeSheetObject.getName();
    let activeSheetType = activeSheetObject.getSheetType();

    embeddedViz = {
      vizObject: vizObject,
      vizDomNode: vizDomNode,
      vizUrl: vizUrl,
      workbookObject: workbookObject,
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


    // future: if filterAreAllValuesSelected === 'false', then try to clone viz in hidden div, apply all filters and get domain values
    let filterFieldNames = denormalizedFilters.map(data => data.filterFieldName);
    let filterFieldNamesUnique = [...new Set(filterFieldNames)];
    // loop through unique filterFieldNameArray and return normalized array of filter -> sheet targets
    for (let i = 0; i < filterFieldNamesUnique.length; i++) {
      // filter on filterFieldName
      let temp_filteredArray = denormalizedFilters.filter(data => data.filterFieldName === filterFieldNamesUnique[i]);
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

        case 'relative_date':
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
    // embeddedVizzes.push(this.filters);
    embeddedViz.filters = filters;
    this.embeddedVizzes.push(embeddedViz);
    return this;

  }

  updateOption(option) {
    this.option = $.extend(this.option, option);
    // toggle event listener
    if (this.option.isFilterEventListenterEnabled) {
      viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    } else {
      viz.removeEventListener(tableau.TableauEventName.FILTER_CHANGE, this.onFilterSelection.bind(this));
    }
    return this;

  }




  // *** NEED TO ADD ALL OPTIONS, NULL STUFF, INCLUDE/EXCLUDE -- SEE ONLINE HELP ****
  // could think about using recursion now that I'm accepting multiple vizzes (i.e. an array of vizzes via targetVizArray)
  async applyFilters(filterFieldName, targetVizArray, updateType, values) {
    let filterToApplyArray = [];
    let i;
    let filterType;
    let promiseArray = [];
    let update = this.vizUpdateMode.ALL;

    // if targetVizArray is type string and equal to "all", apply filters to all vizzes
    if (typeof targetVizArray === 'string' || targetVizArray instanceof String) {
      if (update === this.vizUpdateMode.ALL) {
        for (i = 0; i < this.embeddedVizzes.length; i++) {
          let filter = this.embeddedVizzes[i].filters.filter(filter => filter.filterFieldName === filterFieldName);
          // do this once to be more efficient
          filterType = filter[0].filterFieldType;
          filterToApplyArray.push(filter[0]);
        }
      }




    }
    // otherwise, apply filter to vizzes provided in the array
    else if (Array.isArray(targetVizArray)) {
      for (i = 0; i < targetVizArray.length; i++) {
        let viz = this.embeddedVizzes.filter(v => v.activeSheetName === targetVizArray[i]);
        let filter = viz[0].filters.filter(filter => filter.filterFieldName === filterFieldName);
        filterType = filter[0].filterFieldType;
        filterToApplyArray.push(filter[0]);
        // console.log("targetVizArray", targetVizArray);
        // console.log("viz", viz);
        // console.log("viz[0]", viz[0]);
        // console.log("filter[0]", filter[0]);
      }
    }

    // loop through all the viz and
    for (i = 0; i < filterToApplyArray.length; i++) {
      let filterToApply = filterToApplyArray[i];
      let promise = this.applyFilterValues(filterToApply, filterType, updateType, values);
      promiseArray.push(promise);

      console.log("i", i);
      console.log("filterToApplyArray", filterToApplyArray);
      console.log("updateType", updateType);
      console.log("filterToApply", filterToApply);

    }
    // https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
    // await Promise.all(promiseArray);


    const data = await Promise.all(promiseArray);
    console.log("data", data);

    //
    // const data = await Promise.all(promiseArray);


  }





  // // *** NEED TO ADD ALL OPTIONS, NULL STUFF, INCLUDE/EXCLUDE -- SEE ONLINE HELP ****
  // // could think about using recursion now that I'm accepting multiple vizzes (i.e. an array of vizzes via targetVizArray)
  // async applyFilters(filterFieldName, targetVizArray, updateType, values) {
  //   let filterToApplyArray = [];
  //   let i;
  //   let j;
  //   let filterType;
  //
  //   // this.vizUpdateMode = {ALL: "all"}
  //   let update = this.vizUpdateMode.ALL;
  //
  //   if (!Array.isArray(targetVizArray)) {
  //     if (targetVizArray === update) {
  //       for (i = 0; i < this.embeddedVizzes.length; i++) {
  //         let filter = this.embeddedVizzes[i].filters.filter(filter => filter.filterFieldName == filterFieldName);
  //         // do this once to be more efficient
  //         filterType = filter[0].filterFieldType;
  //         filterToApplyArray.push(filter[0]);
  //       }
  //     }
  //
  //   } else {
  //     for (i = 0; i < targetVizArray.length; i++) {
  //       let viz = this.embeddedVizzes.filter(v => v.activeSheetName === targetVizArray[i]);
  //       let filter = viz[0].filters.filter(filter => filter.filterFieldName == filterFieldName);
  //       filterType = filter[0].filterFieldType;
  //       filterToApplyArray.push(filter[0]);
  //       // console.log("targetVizArray", targetVizArray);
  //       // console.log("viz", viz);
  //       // console.log("viz[0]", viz[0]);
  //       // console.log("filter[0]", filter[0]);
  //     }
  //   }
  //
  //   for (i = 0; i < filterToApplyArray.length; i++) {
  //     console.log("i", i);
  //
  //     console.log("filterToApplyArray", filterToApplyArray);
  //     console.log("updateType", updateType);
  //
  //     if (updateType === 'CLEAR') {
  //       for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //         filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.clearFilterAsync(filterToApplyArray[i].filterFieldName);
  //       }
  //       return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.clearFilterAsync(filterToApplyArray[i].filterFieldName);
  //
  //     } else {
  //       // console.log("got to line 315");
  //       // console.log("filterType", filterType);
  //
  //       switch (filterType) {
  //
  //         case "categorical":
  //
  //           switch (updateType) {
  //
  //             case 'ALL':
  //
  //               for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                 filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //               }
  //               return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //               // break;
  //
  //             case 'REPLACE':
  //
  //               console.log("i", i);
  //               console.log("filterToApplyArray[i]", filterToApplyArray[i]);
  //
  //               // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //               for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                 // console.log("filterToApplyArray[i].targetWorksheets.length", filterToApplyArray[i].targetWorksheets.length);
  //                 console.log("j", j);
  //                 filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //               }
  //               console.log("j", j);
  //               return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //               // break;
  //
  //             case 'ADD':
  //
  //               // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //               for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                 filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //               }
  //               return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //               // break;
  //
  //             case 'REMOVE':
  //
  //               // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //               for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                 filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //               }
  //               return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //               // break;
  //
  //           }
  //           // break;
  //
  //           case "quantitative":
  //
  //             switch (updateType) {
  //
  //               case 'ALL':
  //
  //                 // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                 for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                   filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                 }
  //                 return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                 // break;
  //
  //               case 'REPLACE':
  //
  //                 // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                 for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                   filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                 }
  //                 return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                 // break;
  //
  //               case 'ADD':
  //
  //                 // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                 for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                   filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                 }
  //                 return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                 // break;
  //
  //               case 'REMOVE':
  //
  //                 // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                 for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                   filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                 }
  //                 return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                 // break;
  //
  //             }
  //             // break;
  //
  //             case "hierarchical":
  //
  //               switch (updateType) {
  //
  //                 case 'ALL':
  //
  //                   // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                   for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                     filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                   }
  //                   return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                   // break;
  //
  //                 case 'REPLACE':
  //
  //                   // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                   for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                     filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                   }
  //                   return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                   // break;
  //
  //                 case 'ADD':
  //
  //                   // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                   for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                     filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                   }
  //                   return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                   // break;
  //
  //                 case 'REMOVE':
  //
  //                   // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                   for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                     filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                   }
  //                   return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                   // break;
  //
  //               }
  //               // break;
  //
  //               case "relative_date":
  //
  //                 switch (updateType) {
  //
  //                   case 'ALL':
  //
  //                     // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                     for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                       filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                     }
  //                     return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ALL);
  //                     // break;
  //
  //                   case 'REPLACE':
  //
  //                     // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                     for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                       filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                     }
  //                     return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //                     // break;
  //
  //                   case 'ADD':
  //
  //                     // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                     for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                       filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                     }
  //                     return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.ADD);
  //                     // break;
  //
  //                   case 'REMOVE':
  //
  //                     // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //
  //                     for (j = 0; j < filterToApplyArray[i].targetWorksheets.length - 1; j++) {
  //                       filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                     }
  //                     return await filterToApplyArray[i].targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApplyArray[i].filterFieldName, values, tableau.FilterUpdateType.REMOVE);
  //                     // break;
  //
  //                 }
  //                 // break;
  //
  //       }
  //
  //     }
  //
  //
  //   }
  //
  // }

  // // method to apply filter values
  // // this works (filtering)
  // async applyFilters1(filterFieldName, values) {
  //   const _this = this;
  //   let index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);
  //   let i;
  //   for (i = 0; i < this.embeddedViz.filters[index].targetWorksheets.length - 1; i++) {
  //     this.embeddedViz.filters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.embeddedViz.filters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //   }
  //   return await this.embeddedViz.filters[index].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(this.embeddedViz.filters[index].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  // }
  //
  // // this is more efficient because I don't have to retrieve item via index (search array) each time
  // async applyFilters2(filterFieldName, values) {
  //   let filterToApply = this.embeddedViz.filters.filter(filter => filter.filterFieldName == filterFieldName);
  //   filterToApply = filterToApply[0];
  //   // console.log("filterToApply:", filterToApply[0]);
  //   console.log("filterToApply:", filterToApply);
  //   // console.log("filterToApply[0].targetWorksheets:", filterToApply[0].targetWorksheets);
  //   console.log("filterToApply[0].targetWorksheets:", filterToApply.targetWorksheets);
  //   let i;
  //
  //   for (i = 0; i < filterToApply.targetWorksheets.length - 1; i++) {
  //     filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //   }
  //   return await filterToApply.targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //
  //
  //   // for (i = 0; i < filterToApply[0].targetWorksheets.length - 1; i++) {
  //   //   filterToApply[0].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply[0].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //   // }
  //   // return await filterToApply[0].targetWorksheets[i].targetWorksheetObject.applyFilterAsync(filterToApply[0].filterFieldName, values, tableau.FilterUpdateType.REPLACE);
  //
  // }






  // method to get filters for specified type of filter (e.g. categorical, quantitative, hierarchical, relative_date)
  getFiltersByType(type) {
    let filteredFilters = this.embeddedViz.filters.filter(obj => obj.filterFieldType === type);
    return filteredFilters;
  }

  // var getFiltersByType = function (type){
  //
  //
  // }

  // internal/helper function to apply filters
  async applyFilterValues(filterToApply, filterType, updateType, values) {
    let j;

    if (updateType === 'CLEAR') {
      for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
        filterToApply.targetWorksheets[j].targetWorksheetObject.clearFilterAsync(filterToApply.filterFieldName);
      }
      return await filterToApply.targetWorksheets[j].targetWorksheetObject.clearFilterAsync(filterToApply.filterFieldName);

    } else {
      // console.log("got to line 315");
      // console.log("filterType", filterType);

      switch (filterType) {

        case "categorical":

          switch (updateType) {

            case 'ALL':

              for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
              }
              return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
              // break;

            case 'REPLACE':

              // console.log("i", i);
              console.log("filterToApply", filterToApply);

              // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                // console.log("filterToApply.targetWorksheets.length", filterToApply.targetWorksheets.length);
                console.log("j", j);
                filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              }
              console.log("j", j);
              return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
              // break;

            case 'ADD':

              // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
              }
              return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
              // break;

            case 'REMOVE':

              // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

              for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              }
              return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
              // break;

          }
          // break;

          case "quantitative":

            switch (updateType) {

              case 'ALL':

                // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                  filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                }
                return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                // break;

              case 'REPLACE':

                // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                  filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                }
                return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                // break;

              case 'ADD':

                // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                  filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                }
                return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                // break;

              case 'REMOVE':

                // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                  filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                }
                return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRangeFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                // break;

            }
            // break;

            case "hierarchical":

              switch (updateType) {

                case 'ALL':

                  // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                  for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                    filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                  }
                  return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                  // break;

                case 'REPLACE':

                  // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                  for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                    filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                  }
                  return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                  // break;

                case 'ADD':

                  // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                  for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                    filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                  }
                  return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                  // break;

                case 'REMOVE':

                  // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                  for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                    filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                  }
                  return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyHierarchicalFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                  // break;

              }
              // break;

              case "relative_date":

                switch (updateType) {

                  case 'ALL':

                    // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                    for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                      filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                    }
                    return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ALL);
                    // break;

                  case 'REPLACE':

                    // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                    for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                      filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                    }
                    return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REPLACE);
                    // break;

                  case 'ADD':

                    // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                    for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                      filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                    }
                    return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.ADD);
                    // break;

                  case 'REMOVE':

                    // index = this.embeddedViz.filters.findIndex(filter => filter.filterFieldName === filterFieldName);

                    for (j = 0; j < filterToApply.targetWorksheets.length - 1; j++) {
                      filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                    }
                    return await filterToApply.targetWorksheets[j].targetWorksheetObject.applyRelativeDateFilterAsync(filterToApply.filterFieldName, values, tableau.FilterUpdateType.REMOVE);
                    // break;

                }
                // break;

      }

    }


  }


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

}