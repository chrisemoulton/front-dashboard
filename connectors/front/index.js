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

module.exports.getSentMessagesToday = function (done) {
  needle.get(baseUrl + 'metrics/messages/sent/day?key=' + config('front_key'), function (err, response) {
    if (err)
      return done(err);

    done(null, response.body);
  });
};
