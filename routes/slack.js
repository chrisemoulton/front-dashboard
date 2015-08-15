var paperwork = require('paperwork'),
    config = require('../util/config'),
    gecko = require('../connectors/gecko');

exports.mount = function (app) {
  // Slack webhook when "/dash" command is used.
  app.post('/hooks/slack/dash', paperwork.accept({
    token: String,
    text: String
  }), function (req, res) {
    // Make sure the source was Slack.
    if (req.body.token !== config('slack.command_token_dash'))
      return res.status(500).send('Invalid token');

    // Send to gecko asynchronously.
    gecko.sendText('slack', req.body.text, function (err) {
      if (err)
        return res.status(400).send(err);

      res.send(200);
    });
  });
};
