var _ = require('underscore'),
    moment = require('moment-timezone'),
    github = require('github'),
    config = require('../../util/config'),
    priv = {};

// Intialize Github client.
var client = new github({
  // Required.
  version: '3.0.0'
});

module.exports.getOpenIssueCount = function (done) {
  return priv.countGithubSearch('repo:frontapp/front+state:open', done);
};

module.exports.getClosedTodayIssueCount = function (done) {
  return priv.countGithubSearch('repo:frontapp/front+type:issues+closed:>=' + moment().subtract(1, 'd').format(), done);
};

module.exports.getMergedTodayPrCount = function (done) {
  return priv.countGithubSearch('repo:frontapp/front+type:pr+merged:>=' + moment().subtract(1, 'd').format(), done);
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
