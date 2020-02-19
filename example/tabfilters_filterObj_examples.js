// applyFilters(filterObj) method
// Note: if mode = 'sheet', then targetArray contains objects (viz and sheetsArray properties) representing the target viz/sheet combo; i.e. the fitler is applied to specific sheets contained within the viz. The viz property is type string and represents the target viz and sheetsArray is a property of type array that represents the target sheet(s).

// The filter will apply to the "CustomerOverview" and "CustomerScatter" sheets on the "Customers" viz and to  "DaystoShip" and "ShipSummary" sheets on the "Shipping" viz.

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