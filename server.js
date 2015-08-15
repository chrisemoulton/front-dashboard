var express = require('express'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    config = require('./util/config');

var gecko = require('./connectors/gecko');

// Create the app.
var app = express();

// Configuration.
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

// Declare the routes.
routes.mount(app);

app.get('/test', function (req, res) {
  gecko.sendText('slack', 'Hello2', function (err) {
    res.send({
      message: config('gecko.api_key')
    });
  });
});

// Start the server.
var server = app.listen(process.env.PORT || 4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
