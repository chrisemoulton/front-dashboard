var _ = require('underscore'),
    config = require('../../util/config'),
    stripe = require('stripe')(config('stripe.api_key'));

exports.computeMrr = function (done) {
  loadAllCustomers(true, function (err, customers) {
    var mrr = _(customers).reduce(function (mrr, customer) {
      return mrr + getPrice(customer);
    }, 0);

    done(null, mrr);
  });
};

function loadAllCustomers(allPages, done) {
  var pages = [];

  function loadPage(afterId, done) {
    var options = {limit: 100};

    if (afterId)
      options.starting_after = afterId;

    stripe.customers.list(options, function (err, page) {
      if (err)
        return done(err);

      pages.push(page.data);

      var lastCustomer = _(page.data).last();

      if (!allPages || !page.has_more || !lastCustomer)
        return done(null, _(pages).flatten());

      loadPage(lastCustomer.id, done);
    });
  }

  loadPage(null, done);
}

function getPrice(customer) {
  var subscription = customer.subscriptions.data[0];

  if (!subscription || subscription.status !== 'active')
    return 0;

  var plan = subscription.plan,
      interval = plan.interval,
      amount = plan.amount,
      quantity = subscription.quantity;

  var price = quantity * amount / 100;

  if (interval === 'year')
    price = price / 12;

  price = applyDiscount(price, customer);

  //var description = (customer.description || '(no name)').replace(/,/g, '').replace(/^prod\-\S+ /, '');
  //console.log(customer.id + ',' + description + ',' + plan.name + ',' + price);

  return price;
}

function applyDiscount(price, customer) {
  var coupon = customer.discount && customer.discount.coupon;

  if (!coupon)
    return price;

  if (coupon.amount_off)
    price = price - coupon.amount_off/100;

  if (coupon.percent_off)
    price = price * (100 - coupon.percent_off)/100;

  return price;
}
