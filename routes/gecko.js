var _ = require('underscore'),
    front = require('../connectors/front');

exports.mount = function (app) {
  app.get('/gecko/topcompanies', function (req, res) {
    front.getTopCompanies(function (err, companies) {
      var result = _.chain(companies)
        .sortBy(function (company) {
          return -company.num;
        })
        .map(function (company) {
          return {
            title: company.name,
            description: String(company.num)
          };
        })
        .value();

      res.send(result);
    });
  });
};
