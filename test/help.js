// TabFilters.applyFilters(filterObj) is a method for filtering. It accepts an objec that defines what filter to apply and to what scope to apply the filter. scope is an object that includes two properties, mode and targetArray. mode is type string and accepts values "page", "viz" or "sheet". targetArray is array of objects, with each objec containing two properties viz and sheetsArray. The viz propety is a string that references the name of the viz and sheetsArray is an array of strings that include the sheet name(s). filter is an object that includes three properties: fieldName, updateType and values.

// Note: updateType accepts values "all", "replace", "add" and "remove". This similar to the Tableau JS API FilterUpdateType Enum, however, updateType also accepts the value of clear. Also, note that the acceptable values for updateType is dependent on the filter type (e.g. "categorical", "quantitative", "hierarchical" and "relativedate"). These filter types match the Tableau JS API FilterType Enum.

// The updateType is type string and accepts values all, replace, add and remove

// applyFilters(filterObj) method
// Note: if mode = 'sheet', then targetArray contains objects (viz and sheetsArray properties) representing the target viz/sheet combo; i.e. the fitler is applied to specific sheets contained within the viz. The viz property is type string and represents the target viz and sheetsArray is a property of type array that represents the target sheet(s).

// The filter will apply to the "CustomerOverview" and "CustomerScatter" sheets on the "Customers" viz and to  "DaystoShip" and "ShipSummary" sheets on the "Shipping" viz.
// What happens if any of the sheets don't contain the filter.fieldName "Region"?

var applyFilterObj_sheetExample = {
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

// What happens if any of the vizzes don't contain the filter.fieldName "Region"?

var applyFilterObj_vizExample = {
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

var applyFilterObj_pageExample = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Region",
    updateType: "replace",
    values: ["East", "West"]
  }
};


// getFilterNames(filterObj) method
// accepts an object that includes the viz, sheet and filter name
var getFilterObj_example = {
  target: {
    viz: "Customers",
    sheet: "CustomerOverview"
  },
  filter: {
    fieldType: "categorical",
  }
};