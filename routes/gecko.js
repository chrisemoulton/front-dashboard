var _ = require('underscore'),
    front = require('../connectors/front');

exports.mount = function (app) {
  app.get('/gecko/topcompanies', function (req, res) {
    front.getTopCompanies(function (err, companies) {
      res.send(_(companies).map(function (company) {
        return {
          title: company.name,
          description: String(company.num)
        };
      }));
    });
  });
};
