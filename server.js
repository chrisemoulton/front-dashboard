var express = require('express'), 
    bodyParser = require('body-parser'),
    routes = require('./routes');

// Create the app.
var app = express(); 

// Configuration.
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

// Declare the routes.
routes.mount(app);

// Start the server.
var server = app.listen(process.env.PORT || 4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
