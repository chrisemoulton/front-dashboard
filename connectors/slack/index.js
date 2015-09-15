var _ = require('underscore'),
    request = require('request'),
    util = require('util'),
    config = require('../../util/config');

exports.send = function (title, message, done) {

  var slackUrl = config('slack.room_techbots')

  var msg = util.format('@here *%s*: %s', title, message);
  var payload = {
    username: 'AWS alarms',
    icon_emoji: ':zoidberg:',
    text: msg
  };

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
