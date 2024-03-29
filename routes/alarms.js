var paperwork = require('paperwork'),
    request = require('request'),
    bodyParser = require('body-parser'),
    util = require('util'),
    slack = require('../connectors/slack'),
    config = require('../util/config')
    strings = require('../util/strings');

exports.mount = function (app) {
  app.post('/aws_alarms/' + config('alarms_token'), bodyParser.text(), function (req, res) {
    res.sendStatus(200);

    console.log('req.body', req.body);
    var asJSON = null,
        subject = null,
        message = null;

    try {
      asJSON = JSON.parse(req.body);
    }
    catch (e) {
      console.log('Error parsing alarm', req.body, e);
      return;
    }

    // Check if we need to subscribe to the SNS
    if (asJSON.SubscribeURL) {
      return request.get(asJSON.SubscribeURL)
        .on('response', function(response) {
          console.log('Response when subscribing', response.statusCode, response.body);
          return;
        })
        .on('error', function (err) {
          console.log('Error subscribing to SNS', err);
          return;
        });
    }

    var date = asJSON.Timestamp;
    var parsedMessage = JSON.parse(asJSON.Message);
    var message = parsedMessage.NewStateReason;
    var subject = parsedMessage.AlarmName;

    var payload = {
      username: 'AWS alarms',
      icon_emoji: ':zoidberg:',
      text: util.format('<!channel> *%s* %s %s', subject, message, date)
    };

    slack.send(payload, function () { return; });
  });
};
