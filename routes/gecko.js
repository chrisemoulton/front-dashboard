var _ = require('underscore'),
    async = require('async'),
    moment = require('moment-timezone'),
    front = require('../connectors/front'),
    stripe = require('../connectors/stripe'),
    storage = require('../connectors/storage');

exports.mount = function (app) {
  var priv = {};

  app.get('/gecko/top_companies', function (req, res) {
    front.getTopCompanies(function (err, companies) {
      if (err)
        return res.status(400).send(err);

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

  app.get('/gecko/sent_messages', function (req, res) {
    var daysBack = [];
    for (var i = 6; i >= 0; i--) daysBack.push(i);

    // Retrieve the values for every day.
    async.map(daysBack, function (dayBack, doneDay) {
      front.getSendMessagesForDay(dayBack, doneDay);
    }, function (err, results) {
      if (err)
        return res.status(400).send(err);

      var dates = _(daysBack).map(function (dayBack) {
        return priv.adaptMoment(moment().tz('America/Los_Angeles').subtract(dayBack, 'd'));
      });

      return res.send({
        x_axis: {
          type: 'datetime'
        },
        series: [{
          data: _(results).map(function (result, index) {
            return [dates[index], result];
          }),
          incomplete_from: _(dates).last()
        }]
      });
    });
  });

  app.get('/gecko/sent_messages_today', function (req, res) {
    async.parallel({
      today: function (done) {
        front.getSendMessagesForDay(0, done);
      },
      lastWeek: function (done) {
        front.getSendMessagesForDay(6, done);
      }
    }, function (err, results) {
      if (err)
        return res.status(400).send(err);

      res.send({
        item: [{
          value: results.today
        }, {
          value: results.lastWeek
        }]
      });
    });
  });

  app.get('/gecko/mrr_day', function (req, res) {
    return priv.returnMrrDiff(priv.today(), priv.yesterday(), res);
  });

  app.get('/gecko/mrr_month', function (req, res) {
    return priv.returnMrrDiff(priv.today(), priv.lastMonth(), res);
  });

  app.get('/gecko/mrr_year', function (req, res) {
    return priv.returnMrrDiff(priv.today(), priv.lastYear(), res);
  });

  priv.today = function () {
    return moment().tz('America/Los_Angeles');
  };

  priv.yesterday = function () {
    return moment()
      .tz('America/Los_Angeles')
      .subtract(1, 'd');
  };

  priv.lastMonth = function () {
    return moment()
      .tz('America/Los_Angeles')
      .startOf('month')
      .subtract(1, 'd');
  };

  priv.lastYear = function () {
    return moment()
      .tz('America/Los_Angeles')
      .startOf('year')
      .subtract(1, 'd');
  };

  priv.adaptMoment = function (m) {
    return m.format('YYYY-MM-DD');
  };

  var refreshCutoff = 3600 * 1000; // 1h
  priv.returnMrrDiff = function (moment1, moment2, res) {
    async.parallel({
      lastMrrRefresh: function (done) {
        storage.get('meta', 'mrr_last_refresh_date', done);
      },
      item1: function (done) {
        storage.get('mrr', priv.adaptMoment(moment1), done);
      },
      item2: function (done) {
        storage.get('mrr', priv.adaptMoment(moment2), done);
      }
    }, function (err, results) {
      var value1, value2;
      if (err || !results.item1 || !results.item2) {
        value1 = 0;
        value2 = 0;
      }
      else {
        value1 = results.item1.value - results.item2.value;
        value2 = value1 * (results.item2.value / results.item1.value);
      }

      res.send({
        item: [{ value: value1 }, { value: value2 }]
      });

      if (results.lastMrrRefresh && (Date.now() - new Date(results.lastMrrRefresh).getTime()) < refreshCutoff)
        return;

      // Update last refresh date in storage.
      storage.set('meta', 'mrr_last_refresh_date', Date.now(), function () {});

      // Compute current MRR.
      stripe.computeMrr(function (err, mrr) {
        if (err)
          return console.error(err);

        storage.set('mrr', priv.adaptMoment(priv.today()), {
          value: mrr,
          date: Date.now()
        }, function () {});
      });
    });
  };

  priv.mod = function(num1, num2) {
    return ((num1 % num2) + num1) % num2;
  };
};
