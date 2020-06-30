const fs = require('fs')
const  prepend = require('prepend')

console.log('----BEGIN PATCH OF tabfilters.js----')

fs.readFile('./src/regeneratorRuntime.patch.js', (err, data) => {
  if (err) {
    console.log(err)
    return
  }
  prepend('./dist/tabfilters.js', data, (preErr) => {
    if (preErr) {
      console.log('prepend error', preErr)
    }
  })
})

console.log('----END PATCH OF tabfilters.js----')
