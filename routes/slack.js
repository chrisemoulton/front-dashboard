var config = require('config');

exports.mount = function (app) {
  // Slack webhook when "/dash" command is used.
  app.post('/hooks/slack/dash', function (req, res) {

  });
};
