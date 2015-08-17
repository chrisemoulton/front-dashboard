var needle = require('needle'),
    config = require('../../util/config'),
    baseUrl = 'https://api.frontapp.com/dashboard/';

module.exports.getTopCompanies = function (done) {
  needle.get(baseUrl + 'companies/top?key=' + config('front_key'), function (err, response) {
    if (err)
      return done(err);

    done(null, response.body && response.body.companies);
  });
};

module.exports.getSentMessagesForDay = function (day, done) {
  needle.get(baseUrl + 'metrics/messages/sent/day?back=' + day + '&key=' + config('front_key'), function (err, response) {
    if (err)
      return done(err);

    done(null, response.body && response.body.sent);
  });
};
