var _ = require('underscore'),
    async = require('async'),
    moment = require('moment-timezone'),
    front = require('../connectors/front'),
    github = require('../connectors/github'),
    stripe = require('../connectors/stripe'),
    storage = require('../connectors/storage');

exports.mount = function (app) {
  var priv = {};

  app.get('/gecko/github', function (req, res) {
    async.parallel({
      open: function (done) {
        github.getOpenIssueCount(done);
      },
      closedToday: function (done) {
        github.getClosedTodayIssueCount(done);
      },
      mergedToday: function (done) {
        github.getMergedTodayPrCount(done);
      }
    }, function (err, results) {
      if (err)
        return res.status(400).send(err);

      res.send({
        item: [{
          value: results.open,
          text: 'Open'
        }, {
          value: results.closedToday,
          text: 'Closed Today'
        }, {
          value: results.mergedToday,
          text: 'Merged Today'
        }]
      });
    });
  });

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
    for (var i1 = 6; i1 >= 0; i1--) daysBack.push(i1);    // This week.
    for (var i2 = 13; i2 >= 7; i2--) daysBack.push(i2);   // Last week.
    for (var i3 = 34; i3 >= 28; i3--) daysBack.push(i3);  // Last month.

    // Retrieve the values for every day.
    async.map(daysBack, function (dayBack, doneDay) {
      front.getSentMessagesForDay(dayBack, doneDay);
    }, function (err, results) {
      if (err)
        return res.status(400).send(err);

      var dates = _.chain(daysBack).first(7).map(function (dayBack) {
        return priv.adaptMoment(moment().tz('America/Los_Angeles').subtract(dayBack, 'd'));
      }).value();

      return res.send({
        x_axis: {
          type: 'datetime'
        },
        series: [{
          name: 'This week',
          data: _.chain(results).first(7).map(function (result, index) {
            return [dates[index], result];
          }).value(),
          incomplete_from: _(dates).last()
        }, {
          name: 'Last week',
          data: _.chain(results).rest(7).first(7).map(function (result, index) {
            return [dates[index], result];
          }).value()
        }, {
          name: 'Last month',
          data: _.chain(results).rest(14).first(7).map(function (result, index) {
            return [dates[index], result];
          }).value()
        }]
      });
    });
  });

  app.get('/gecko/sent_messages_today', function (req, res) {
    async.parallel({
      today: function (done) {
        front.getSentMessagesForDay(0, done);
      },
      lastWeek: function (done) {
        front.getSentMessagesForDay(7, done);
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

  app.get('/gecko/mrr_week', function (req, res) {
    return priv.returnMrrDiff(priv.today(), priv.lastWeek(), res);
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

  priv.lastWeek = function () {
    return moment()
      .tz('America/Los_Angeles')
      .startOf('isoweek')
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
        item: [{ value: value1 }, { value: value2 }],
        moment1: priv.adaptMoment(moment1),
        moment2: priv.adaptMoment(moment2)
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
