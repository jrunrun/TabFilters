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
        console.log("filterObj", filterObj);
        filters.applyFilters(filterObj);
      }, 5000 * i);
    }(i));
  }

}

// filter tester that runs n number of times with a delay of 5 seconds between executions
async function testFilterTypes(array) {
  for (var i = 1; i < array.length; i++) {

    // on first execution, reset all the vizzes (clear any lingering filters/states)
    if (i === 1) {
      await resetAllVizzes();
      filters.applyFilters(array[i]);
    }

    (function(i) {
      setTimeout(function() {

        filters.applyFilters(array[i]);
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