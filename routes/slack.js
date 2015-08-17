var paperwork = require('paperwork'),
    retext = require('retext'),
    emoji = require('retext-emoji'),
    config = require('../util/config'),
    gecko = require('../connectors/gecko'),
    strings = require('../util/strings');

var retext = new retext().use(emoji, {
  convert: 'encode'
});

exports.mount = function (app) {
  // Slack webhook when "/dash" command is used.
  app.post('/hooks/slack', paperwork.accept({
    token: String,
    text: String
  }), function (req, res) {
    // Make sure the source was Slack.
    if (req.body.token !== config('slack.command_token_dash'))
      return res.status(500).send('Invalid token');

    // Parse text as retext.
    retext.parse(req.body.text, function (err, tree) {
      var returnResponse = function (err) {
        if (err)
          return res.status(400).send(err);

        res.send(200);
      };

      // Send as text or image, depending on type.
      return strings.isUrl(req.body.text) ?
        gecko.sendImage('slack_image', req.body.text, returnResponse) :
        gecko.sendText('slack_text', err ? req.body.text : tree.toString(), returnResponse);
    });
  });
};
