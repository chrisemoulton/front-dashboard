var express = require('express'),
    routes = require('./routes'),
    config = require('./util/config');

// Create the app.
var app = express();

// Declare the routes.
routes.mount(app);

app.get('/test', function (req, res) {
  res.send({
    message: config('slack.command_token_dash')
  });
});

// Start the server.
var server = app.listen(process.env.PORT || 4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
