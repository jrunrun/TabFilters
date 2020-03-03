// applyFilters(filterObj) method
// Note: if mode = 'sheet', then targetArray contains objects (viz and sheetsArray properties) representing the target viz/sheet combo; i.e. the fitler is applied to specific sheets contained within the viz. The viz property is type string and represents the target viz and sheetsArray is a property of type array that represents the target sheet(s).

// The filter will apply to the "CustomerOverview" and "CustomerScatter" sheets on the "Customers" viz and to  "DaystoShip" and "ShipSummary" sheets on the "Shipping" viz.

var categorical_sheetExample = {
  scope: {
    mode: "sheet",
    targetArray: [{
        viz: "Customers",
        sheetsArray: ["CustomerOverview", "CustomerScatter"]
      },
      {
        viz: "Shipping",
        sheetsArray: ["DaystoShip", "ShipSummary"]
      }
    ]
  },
  filter: {
    fieldName: "Region",
    updateType: "replace",
    values: ["East", "West"]
  }
};

// applyFilters(filterObj) method
// Note: if mode = 'viz', then targetArray contains strings representing the target viz only. In this mode, the fitler is applied globally to the viz; i.e. all sheets contained within the viz that include the filter.fieldName are filtered.

// "Customers" and "Product" are the target vizzes. The filter will apply to all sheets contained within the each of those vizzes that include the filter.fieldName "Region".

var categorical_vizExample = {
  scope: {
    mode: "viz",
    targetArray: ["Customers", "Product"]
  },
  filter: {
    fieldName: "Region",
    updateType: "replace",
    values: ["East", "West"]
  }
};

// applyFilters(filterObj) method
// Note: if mode = 'page', then the targetArray property is omitted. In this mode, the fitler is applied globally to the hosting page; i.e. all vizzes and sheets contained within the page that include the filter.fieldName are filtered.

// The filter will apply to all vizzes and sheets contained on the hosting page that include the filter.fieldName "Region".

var categorical_pageExample_1 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Region",
    updateType: "replace",
    values: ["East", "West"]
  }
};

// temp testing filter object that contains filter field that only exists on single Viz
var categorical_pageExample_2 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Category",
    updateType: "replace",
    values: ["Furniture", "Office Supplies"]
  }
};


// See Tableau Online Help for RelativeDateFilterOptions
// https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm?#relativedatefilteroptions_record

// possible values for rangeType (based off of tableau.DateRangeType)
// "last", "lastn", "next", "nextn", "curr" and "todate"

// possible values for periodType (based off of tableau.PeriodType)
// "year", "quarter", "month", "week", "day", "hour", "minute" and "second"

// anchorDate is optional
// rangeN
var relativeDate_pageExample = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Order Date (relative date filter)",
    values: {
      // anchorDate: new Date(Date.UTC(2016, 1, 1)),
      periodType: "quarter",
      rangeType: "lastn",
      rangeN: 8
    }
  }
};

// possible values for nullOption (based off of tableau.NullOption)
// "nullValues", "nonNullValues" and "allValues"

var rangeFilter_pageExample = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "AGG(Profit Ratio)",
    values: {
      nullOption: "nonNullValues",
      min: -.167,
      max: .245
    }
  }
};

// // this scope is unlikely, but it's possible the same parameter name exists on multiple workbooks embedded in same page
// var parameter_Example_1 = {
//   scope: {
//     mode: "workbook",
//     targetArray: ["tabfilters_v3"]
//   },
//   parameter: {
//     parameterName: "Region Filter (Wildcard via Parameter)",
//     values: "w"
//   }
// };

// testing this now
var parameter_Example_2 = {
  scope: {
    mode: "viz",
    targetArray: ["Customers", "Overview"]
  },
  parameter: {
    parameterName: "Region Filter (Wildcard via Parameter)",
    values: "w"
  }
};

// this works
var parameter_Example_3 = {
  scope: {
    mode: "page"
  },
  parameter: {
    parameterName: "Region Filter (Wildcard via Parameter)",
    values: "w"
  }
};


var filtersArray = [categorical_pageExample_1, categorical_pageExample_2, rangeFilter_pageExample, relativeDate_pageExample];