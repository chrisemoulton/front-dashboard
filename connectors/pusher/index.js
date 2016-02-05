var _ = require('underscore');
var Pusher = require('pusher');
var config = require('../../util/config');

var pusher;

if (config('pusher_app_id'))
  pusher = new Pusher({
    appId: config('pusher_app_id'),
    key: config('pusher_key'),
    secret: config('pusher_secret')
  });

exports.countActiveUsers = function (done) {
  pusher.get({ path: '/channels', params: {filter_by_prefix: 'private-teammate-'} }, function (err, request, response) {
    var count = 0;

    if (err)
      return done({message: err.message});

    if (response.statusCode >= 300)
      return done({message: 'code:' + response.statusCode});

    try {
      var channels = JSON.parse(response.body).channels;
      count = _(channels).size();

      done(null, count);
    } catch (e) {
      done({message: 'could not parse response: ' + e.message});
    }
  });
};
