var _ = require('underscore'),
    async = require('async'),
    needle = require('needle'),
    moment = require('moment-timezone'),
    storage = require('../storage'),
    config = require('../../util/config'),
    baseUrl = 'https://api.frontapp.com/dashboard/',
    priv = {};

module.exports.getTopCompanies = function (done) {
  needle.get(baseUrl + 'companies/top?key=' + config('front_key'), function (err, response) {
    if (err)
      return done(err);

    done(null, response.body && response.body.companies);
  });
};

module.exports.getSentMessagesForDay = function (day, full, done) {
  async.auto({
    // Try and retrieve from cache first.
    cache: function (next) {
      if (day === 0 || !full)
        return next();

      storage.get('sentmessages', priv.getKeyForDay(day), next);
    },
    // Retrieve from API if needed.
    api: ['cache', function (next, results) {
      if (_.isNumber(results.cache))
        return next();

      needle.get(baseUrl + 'metrics/messages/sent/day?back=' + day + '&key=' + config('front_key') + '&mode=' + (day === 0 || !full ? 'relative' : 'full'), function (err, response) {
        if (err)
          return next(err);

        next(null, response.body && response.body.sent);
      });
    }],
    // Store in cache if needed.
    setCache: ['api', function (next, results) {
      if (!_.isNumber(results.api))
        return next();

      storage.set('sentmessages', priv.getKeyForDay(day), results.api, next);
    }]
  }, function (err, results) {
    if (err)
      return done(err);

    done(null, _.isNumber(results.cache) ? results.cache : results.api);
  });
};

priv.getKeyForDay = function (day) {
  return moment()
    .tz('America/Los_Angeles')
    .subtract(day ,'d')
    .format('YYYY-MM-DD');
};
