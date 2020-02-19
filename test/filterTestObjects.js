// test globals
// var modes = ["page", "viz", "sheet"];
// var modes = ["page", "viz"];
// var regions = ["East", "West", "Central", "South"];
// var vizzes = ["Product", "Customers", "Shipping", "Overview"];

// filter object factory for testing (raondomizes the object properties)
function filterObjectFactory(templateObj) {

  let index;
  let modes = ["page", "viz"];
  let regions = ["East", "West", "Central", "South"];
  let vizzes = ["Product", "Customers", "Shipping", "Overview"];
  // note that tableau.FilterUpdateType Enum only includes: {ALL: "all", REPLACE: "replace", ADD: "add", REMOVE: "remove"}
  // I'm including clear and using that to route to clearFilterAsync(fieldName: string) which is supported for all filter types
  let updateType = ["all", "replace", "add", "remove", "clear"];

  // randomly select single item from array
  let randomMode = modes[Math.floor(Math.random() * modes.length)];
  let randomupdateType = updateType[Math.floor(Math.random() * updateType.length)];

  // randomly delete single item from regions array
  let randomRegion = regions[Math.floor(Math.random() * regions.length)];
  index = regions.indexOf(randomRegion);
  regions.splice(index, 1);

  // randomly delete single item from vizzes array
  let randomViz = vizzes[Math.floor(Math.random() * vizzes.length)];
  index = vizzes.indexOf(randomViz);
  vizzes.splice(index, 1);

  // set random values for mode and values
  templateObj.scope.mode = randomMode;
  templateObj.filter.values = regions;
  templateObj.filter.updateType = randomupdateType;


  if (randomMode === "sheet") {
    // templateObj.scope.targetArray = [{
    //     viz: randomViz,
    //     sheetsArray: ["CustomerOverview", "CustomerScatter"]
    //   },
    //   {
    //     viz: randomViz,
    //     sheetsArray: ["DaystoShip", "ShipSummary"]
    //   }
    // ];

  } else if (randomMode === "viz") {
    templateObj.scope.targetArray = vizzes;

  }

  return templateObj;

}


// filter tester that runs n number of times with a delay of 5 seconds between executions
async function testFilters(n, filterTemplate) {
  let filterObj;
  for (var i = 1; i < n; i++) {
    // on first execution, reset all the vizzes (clear any lingering filters/states)
    if (i === 1) {
      await resetAllVizzes();
    }
    (function(i) {
      setTimeout(function() {
        filterObj = filterObjectFactory(filterTemplate);
        console.log("filter.scope.mode", filterObj.scope.mode);
        console.log("filter.scope.targetArray", filterObj.scope.targetArray);
        console.log("filter.filter.values", filterObj.filter.values);
        filters.applyFilters(filterObj);
      }, 5000 * i);
    }(i));
  }

}



async function resetAllVizzes() {
  let promiseArray = [];
  for (var i = 0; i < filters.embeddedVizzes.length; i++) {
    let promise = filters.embeddedVizzes[i].vizObject.revertAllAsync();
    promiseArray.push(promise);
  }
  let data = await Promise.all(promiseArray);
  console.log("data", data);
}



var filter_categorical_page = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Region",
    updateType: "ALL"
  }
};

var filter_clear_region = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Region",
    updateType: "CLEAR"
  }
};

var filter_clear_category = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Category",
    updateType: "CLEAR"
  }
};

var filter_categorical_page_1 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Category",
    updateType: "ALL"
  }
};

var filter_categorical_page_filter_does_not_exist = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Justin",
    updateType: "ALL"
  }
};

var filterValues = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Category",
    updateType: "REPLACE",
    values: ["Furniture", "Technology"]
  }
};

var filterTemplate = {
  scope: {
    mode: "viz",
    // array of target vizzes
    targetArray: ["Customers", "Product", "Shipping"]
  },
  filter: {
    fieldName: "Region",
    updateType: "replace",
    values: ["East", "West"]
  }
};

var filter_categorical_sheet = {
  scope: {
    mode: "sheet",
    // array of target vizzes
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
    updateType: "REPLACE",
    values: ["East", "West"]
  }
};

var filter_quantitative_page_1 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "AGG(Profit Ratio)",
    updateType: "ALL"
  }
};


var filter_quantitative_page_3 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "AGG(Profit Ratio)",
    updateType: "REPLACE",
    values: {
      min: .15,
      max: .72,
      nullOption: "allValues"
      // nullOption: tableau.NullOption.ALL_VALUES
      // NULL_VALUES: "nullValues", NON_NULL_VALUES: "nonNullValues", ALL_VALUES: "allValues"
    }
  }
};

var filter_quantitative_page_2 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Order Date",
    updateType: "REPLACE",
    values: {
      min: new Date(Date.UTC(2018, 3, 1)),
      max: new Date(Date.UTC(2018, 6, 1))
    }

  }
};





// is the anchorDate required or optional
var filter_relativeDate_page_4 = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Order Date #2",
    updateType: "replace",
    values: {
      anchorDate: new Date(Date.UTC(2018, 5, 1)),
      periodType: "quarter",
      rangeType: 'lastn',
      rangeN: 5
    }

  }
};

var filter_clear_relativeDate_page = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Order Date #2",
    updateType: "clear"
  }
};

// left off here 2/13 @ 3am
var filter_clear = {
  scope: {
    mode: "page"
  },
  filter: {
    fieldName: "Order Date #2",
    updateType: "CLEAR"
  }
};



var filterTemplate2 = {
  scope: {
    mode: "viz",
    // array of target vizzes
    targetArray: ["Customers", "Product"]
  },
  filter: {
    fieldName: "Category",
    updateType: "replace",
    values: ["Furniture", "Technology"]
  }
};