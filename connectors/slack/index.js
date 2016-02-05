var _ = require('underscore'),
    request = require('request'),
    util = require('util'),
    config = require('../../util/config');

exports.send = function (payload, done) {

  var slackUrl = config('slack_room_techbots')

  request.post(slackUrl, {
    form: {
      payload: JSON.stringify(payload)
    }
  }, function (err, response) {
    if (err || response.body !== 'ok')
      console.log('Error from Slack', err || response.body);

    return;
  }).on('error', function (err) {
    console.log('Error sending to Slack', err);

    return;
  });
};
