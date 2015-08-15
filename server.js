var express = require('express');
var routes = require('./routes');

// Create the app.
var app = express();

// Declare the routes.
routes.mount(app);

app.get('/test', function (req, res) {
  res.send({
    message: 'Hey guys'
  });
});

// Start the server.
var server = app.listen(process.env.PORT || 4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
