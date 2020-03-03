// global
// var vizParameters;
// var vizzesArray = [];
var filters;

// viz options
var vizOptions = {
  // width: '800px',
  // height: '500px',
  hideTabs: true,
  hideToolbar: true,
  device: "desktop",
  onFirstInteractive: defaultOnFirstInteractive
};

// // called after DOM is ready using jquery ready()
// $(document).ready(function() {
//
//   // initialize tabfilters object once DOM ready
//   filters = new TabFilters();
//
//   // an array to hold each of the viz urls and divs
//   let vizzesToLoadArray = [{
//       vizUrl: 'https://public.tableau.com/views/tabfilters_example/Overview',
//       vizContainerDiv: document.getElementById("vizContainer1")
//     },
//     {
//       vizUrl: 'https://public.tableau.com/views/tabfilters_example/Product',
//       vizContainerDiv: document.getElementById("vizContainer2")
//     },
//     {
//       vizUrl: 'https://public.tableau.com/views/tabfilters_example/Customers',
//       vizContainerDiv: document.getElementById("vizContainer3")
//     },
//     {
//       vizUrl: 'https://public.tableau.com/views/tabfilters_example/Shipping',
//       vizContainerDiv: document.getElementById("vizContainer4")
//     }
//   ];
//
//   for (let i = 0; i < vizzesToLoadArray.length; i++) {
//     initializeViz(vizzesToLoadArray[i].vizContainerDiv, vizzesToLoadArray[i].vizUrl, vizOptions);
//
//   }
//
// });


// called via onload event
function initializeAllVizzes() {

  // initialize tabfilters object once DOM ready
  filters = new TabFilters();
  //
  // // an array to hold each of the viz urls and divs
  // let vizzesToLoadArray = [{
  //     vizUrl: 'https://public.tableau.com/views/tabfilters_example/Overview',
  //     vizContainerDiv: document.getElementById("vizContainer1")
  //   },
  //   {
  //     vizUrl: 'https://public.tableau.com/views/tabfilters_example/Product',
  //     vizContainerDiv: document.getElementById("vizContainer2")
  //   },
  //   {
  //     vizUrl: 'https://public.tableau.com/views/tabfilters_example/Customers',
  //     vizContainerDiv: document.getElementById("vizContainer3")
  //   },
  //   {
  //     vizUrl: 'https://public.tableau.com/views/tabfilters_example/Shipping',
  //     vizContainerDiv: document.getElementById("vizContainer4")
  //   }
  // ];

  //
  // // an array to hold each of the viz urls and divs
  // let vizzesToLoadArray = [{
  //     vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v2/Overview',
  //     vizContainerDiv: document.getElementById("vizContainer1")
  //   },
  //   {
  //     vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v2/Product',
  //     vizContainerDiv: document.getElementById("vizContainer2")
  //   },
  //   {
  //     vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v2/Customers',
  //     vizContainerDiv: document.getElementById("vizContainer3")
  //   },
  //   {
  //     vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v2/Shipping',
  //     vizContainerDiv: document.getElementById("vizContainer4")
  //   }
  // ];

  // an array to hold each of the viz urls and divs
  let vizzesToLoadArray = [{
      vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v3/Overview',
      vizContainerDiv: document.getElementById("vizContainer1")
    },
    {
      vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v3/Product',
      vizContainerDiv: document.getElementById("vizContainer2")
    },
    {
      vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v3/Customers',
      vizContainerDiv: document.getElementById("vizContainer3")
    },
    {
      vizUrl: 'https://demo.tableau.com/t/Tableau/views/tabfilters_v3/Shipping',
      vizContainerDiv: document.getElementById("vizContainer4")
    }
  ];


  // // an array to hold each of the viz urls and divs
  // let vizzesToLoadArray = [{
  //   vizUrl: "https://demo.tableau.com/t/Tableau/views/SuperstoreParameters/Overview",
  //   vizContainerDiv: document.getElementById("vizContainer1")
  // }];



  for (let i = 0; i < vizzesToLoadArray.length; i++) {
    initializeViz(vizzesToLoadArray[i].vizContainerDiv, vizzesToLoadArray[i].vizUrl, vizOptions);

  }

}


function initializeViz(vizContainerDiv, vizUrl, vizOptions) {
  console.log("url:", vizUrl);
  let viz = new tableau.Viz(vizContainerDiv, vizUrl, vizOptions);
  // vizzesArray.push(viz);

}

async function defaultOnFirstInteractive(v) {
  viz = v.getViz();
  await filters.discovery(viz);
  // await filters.parametersDiscovery(viz);

}