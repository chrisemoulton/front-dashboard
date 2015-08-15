var needle = require('needle'),
    config = require('../../util/config'),
    strings = require('../../util/strings'),
    priv = {},
    geckoBaseUrl = 'https://push.geckoboard.com/v1/send/';

module.exports.sendText = function (widget, text, done) {
  // Build payload.
  var payload = {
    item: [{
        text: strings.escapeHtml(text),
        type: 0
    }]
  };

  // Perform the request.
  priv.sendToGecko(widget, payload, done);
};

module.exports.sendImage = function (widget, url, done) {
  // Build payload.
  var payload = {
    item: [{
      text: '<div class="custom-slack-image" style="background-image: url(\'' + url + '\')"></div>',
      type: 0
    }]
  };

  // Perform the request.
  priv.sendToGecko(widget, payload, done);
};

priv.sendToGecko = function (widget, data, done) {
  // Make sure the corresponding key exists.
  var widgetId = config('gecko.widget_key_' + widget);
  if (!widgetId)
    return done('Couldn\'t find widget configuration');

  // Perform request.
  needle.post(geckoBaseUrl + config('gecko.widget_key_' + widget), {
    api_key: config('gecko.api_key'),
    data: data
  }, { json: true }, done);
};
