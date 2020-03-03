# TabFilters

TabFilters is a JavaScript library that simplifies the filter (and parameter) management part of working with the Tableau JavaScript API. This is intended to help increase productivity when embedding Tableau visualizations into your web applications.

TabFilters is fairly plug-n-play. It will automatically discover your filters (and parameters), metadata and parent content objects. It allows you to fetch and apply filter (and parameter) selections globally, or to specific sheets or visualizations using a single call.


## Getting Started with TabFilters

1. Clone or download tabfilters.js
2. Reference tabfilters.js in the html of the hosting web app.

```html

<script type="text/javascript" src="../dist/tabfilters.js"></script>

```

3. Initialize the TabFilters object once the hosting html page is finished loading using DOM onload event or equivalent function (e.g. jquery's $( document ).ready())

Code in HTML file:

```html
<body onload="initializeFilters();">

<script>

function initializeFilters(){
  tabfilters = new TabFilters();

}
</script>

```

4. Initialize Viz object, by calling the Viz constructor and passing a reference to the div container on the HTML page, the URL of the visualization on Tableau Server, and a set of options. See below example, and note the onFirstInteractive callback function. Note: you will do this for each visualization on the page.

```javascript


var placeholderDiv = document.getElementById("tableauViz");
var url = "http://my-server/views/my-workbook/my-view";
var options = {
   hideTabs: true,
   width: "800px",
   height: "700px",
   onFirstInteractive: defaultOnFirstInteractive() {
     // The viz is now ready and can be safely used.
   }
};

var viz = new tableau.Viz(placeholderDiv, url, options);

```

5. Initialize tabfilters by passing in the Viz object once it's been fully initialized. To do this, call the tabfilters discovery method using the onFirstInteractive callback function defined in the options that were used above by Viz constructor. Note: you will do this for each visualization on the page.

```javascript

async function defaultOnFirstInteractive(v) {
  viz = v.getViz();

  // tabfilters
  await tabfilters.discovery(viz);

}

```

6. Apply filters by calling tabfilters.applyFilters(filterObj) method and passing in an object that specifies the filter and target content. The target content can be the entire page, viz or specific sheets.

* For example, the filter object for applying a filter called "Region" with values "East" and "West" to "CustomerOverview" and "CustomerScatter" worksheets on the "Customer" viz and "DaystoShip" and "ShipSummary" on the "Shipping" viz would like this:

```javascript
var filterObject = {
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
```

* For example, the filter object for applying a filter called "Region" with values "East" and "West" to all worksheets on the "Customers" and "Product" visualizations would like this:

```javascript
var filterObject = {
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
```

* For example, the filter object for applying a filter called "Category" with values "Furniture" and "Office Supplies" to all visualizations on the page would like this:

```javascript
var filterObject = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Category",
    updateType: "replace",
    values: ["Furniture", "Office Supplies"]
  }
};
```

* Note: there are four valid types of filters that are supported by the Tableau JS API. This includes: categorical, quantitative, hierarchical and relative_date. The filterObject sub-object called filter will look different for each type. Note that there are nullOption and anchorDate are optional. Please refer to Tableau JS API documentation for specific filter options by type (e.g. NullOption for quantitative and anchorDate for relative_date) and various enumerations for properties such as periodType, rangeType, etc.

* For example, the filter object quantitative will look like this:

```javascript
var filterObject = {
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
```

For example, the filter object relative_date will look like this:

```javascript
var filterObject = {
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
```

7. Apply parameters by calling tabfilters.applyParameters(parameterObj) method and passing in an object that specifies the filter and target content. The target content can be the entire page, viz or specific sheets.

* For example, the parameter object for applying values to a parameter called "Region Filter (Wildcard via Parameter)" with a value of "w" to the "Customers" and "Overview" visualizations would like this:

```javascript
var parameterObj = {
  scope: {
    mode: "viz",
    targetArray: ["Customers", "Overview"]
  },
  parameter: {
    parameterName: "Region Filter (Wildcard via Parameter)",
    values: "w"
  }
};
```

* For example, the parameter object for applying values to a parameter called "Region Filter (Wildcard via Parameter)" with a value of "e" to all visualizations on the page would like this:

```javascript
// this works
var parameterObj = {
  scope: {
    mode: "page"
  },
  parameter: {
    parameterName: "Region Filter (Wildcard via Parameter)",
    values: "e"
  }
};
```

8. Getting the filter (or parameter) metadata such as the domain values is contained within the tabfilters object. I have not had a chance to create the appropriate getter methods. However, this should be fairly trivial to retrieve.

* To get the filters metadata, traverse the array of filter objects in each of the appropriate tabfilters.embeddedVizzes[].filters array. This includes the domain values, which worksheet(s) the filter is applied to and other relevant information. You can access this via the console. It will look something like this:

```javascript
filterFieldName: "Region"
filterObject:
filterFieldType: "categorical"
targetWorksheets: Array(1)
0: {targetVizName: "Product", targetWorksheetName: "ProductDetails", targetWorksheetObject: g…l.t…e.W…t.ss.m…e.getParentDashboard}
length: 1
filterAreAllValuesSelected: true
filterDomainValues: Array(4)
0: {id: 0, text: "Central", tableauRawValue: "Central"}
1: {id: 1, text: "East", tableauRawValue: "East"}
2: {id: 2, text: "South", tableauRawValue: "South"}
3: {id: 3, text: "West", tableauRawValue: "West"}
```

* To get the parameters metadata, traverse the array of filter objects in each of the appropriate tabfilters.embeddedVizzes[].parameters array. This includes the data type, allowable values and other relevant information. You can access this via the console. It will look something like this:

```javascript
parameters: Array(9)
0: {parameterObject: g…l.t…e.P…r.ss.m…e.getName, parameterCurrentValue: {…}, parameterName: "Commission Rate", parameterDataType: "float", parameterAllowableValuesType: "range", …}
1: {parameterObject: g…l.t…e.P…r.ss.m…e.getName, parameterCurrentValue: {…}, parameterName: "New Quota", parameterDataType: "integer", parameterAllowableValuesType: "range", …}
2:
parameterObject: global.tableauSoftware.Parameter.ss.mkType.getName {_impl: ss.m…e.$8}
parameterCurrentValue: {value: "", formattedValue: undefined}
parameterName: "Region Filter (Wildcard via Parameter)"
parameterDataType: "string"
parameterAllowableValuesType: "all"
parameterAllowableValues: null
parameterMinValue: null
parameterMaxValue: null
parameterStepSize: null
parameterStepPeriod: null
targetWorkbook: {targetWorkbookName: "tabfilters_v3", targetWorkbookObject: g…l.t…e.W…k.ss.m…e.getViz}
```
