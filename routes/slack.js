var paperwork = require('paperwork'),
    config = require('../util/config'),
    gecko = require('../connectors/gecko'),
    strings = require('../util/strings');

exports.mount = function (app) {
  // Slack webhook when "/dash" command is used.
  app.post('/hooks/slack', paperwork.accept({
    token: String,
    text: String
  }), function (req, res) {
    // Make sure the source was Slack.
    if (req.body.token !== config('slack.command_token_dash'))
      return res.status(500).send('Invalid token');

    var returnResponse = function (err) {
      if (err)
        return res.status(400).send(err);

      res.send(200);
    };

    // Send as text or image, depending on type.
    return strings.isUrl(req.body.text) ?
      gecko.sendImage('slack_image', req.body.text, returnResponse) :
      gecko.sendText('slack_text', req.body.text, returnResponse);
  });
};
