var _ = require('underscore'),
    async = require('async'),
    front = require('../connectors/front');

exports.mount = function (app) {
  var priv = {};

  app.get('/gecko/topcompanies', function (req, res) {
    front.getTopCompanies(function (err, companies) {
      var result = _.chain(companies)
        .sortBy(function (company) {
          return -company.num;
        })
        .map(function (company) {
          return {
            title: {
              text: company.name
            },
            description: String(company.num)
          };
        })
        .value();

      // Add a label for the first one.
      if (result.length > 0)
        result[0].label = {
          name: 'TOP',
          color: '#2EA1FB'
        };

      res.send(result);
    });
  });

  var days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  app.get('/gecko/sentmessages', function (req, res) {
    var daysBack = [];
    for (var i = 6; i >= 0; i--) daysBack.push(i);

    // Retrieve the values for every day.
    async.map(daysBack, function (dayBack, doneDay) {
      front.getSendMessagesForDay(dayBack, doneDay);
    }, function (err, results) {
      var labels = _(daysBack).map(function (dayBack) {
        return days[priv.mod(new Date(new Date().getTime() - (8 * 3600 * 1000)).getDay() - dayBack, 7)];
      });

      return res.send({
        x_axis: {
          labels: labels
        },
        series: [{
          name: 'Messages sent',
          data: _(results).pluck('sent')
        }]
      });
    });
  });

  priv.mod = function(num1, num2) {
    return ((num1 % num2) + num1) % num2;
  };
};
