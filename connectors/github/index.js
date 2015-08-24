var _ = require('underscore'),
    moment = require('moment-timezone'),
    github = require('github'),
    async = require('async'),
    config = require('../../util/config'),
    priv = {};

// Intialize Github client.
var client = new github({
  // Required.
  version: '3.0.0'
});

module.exports.getOpenIssueCount = function (done) {
  return priv.countGithubSearchAllRepo('state:open', done);
};

module.exports.getClosedTodayIssueCount = function (done) {
  return priv.countGithubSearchAllRepo('type:issues+closed:>=' + priv.getTodayCutoff(), done);
};

module.exports.getMergedTodayPrCount = function (done) {
  return priv.countGithubSearchAllRepo('type:pr+merged:>=' + priv.getTodayCutoff(), done);
};

priv.getTodayCutoff = function () {
  return moment()
    .tz('America/Los_Angeles')
    .startOf('day')
    .format();
};

priv.countGithubSearch = function (query, done) {
  // Set oauth token for next request.
  client.authenticate({
    type: 'oauth',
    token: config('github.auth_token')
  });

  // Perform a search on the open issues.
  client.search.issues({
    q: query
  }, function (err, response) {
    return err || !response || !_.isNumber(response.total_count) ?
      done(err || 'Github error') :
      done(null, response.total_count);
  });
};

priv.countGithubSearchAllRepo = function(query, done) {
  async.parallel({
      front: function (done) {
        priv.countGithubSearch('repo:frontapp/front+' + query, done);
      },
      ios: function (done) {
        priv.countGithubSearch('repo:frontapp/front-mobile+' + query, done);
      }
    }, function (err, results) {
      if (err)
        return done(err);

      done(null, results.front + results.ios);
    });
}
