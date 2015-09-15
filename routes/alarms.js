var paperwork = require('paperwork'),
    request = require('request'),
    bodyParser = require('body-parser'),
    slack = require('../connectors/slack'),
    config = require('../util/config')
    strings = require('../util/strings');

exports.mount = function (app) {
  app.post('/aws_alarms/ec449afb54423ecd350e9f0f8d5ffe2f4e27b58e41087af75793c0e9b784427f', bodyParser.text(), function (req, res) {
    res.sendStatus(200);

    var asJSON = null,
        subject = null,
        message = null;

    try {
      asJSON = JSON.parse(req.body);
      subject = asJSON.Subject;
      message = JSON.parse(asJSON.Message).NewStateReason;
    }
    catch (e) {
      console.log('Error parsing alarm', req.body, e);
      return;
    }

    slack.send(subject, message, function () { return; });
  });
};
