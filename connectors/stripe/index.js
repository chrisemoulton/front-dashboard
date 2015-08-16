var _ = require('underscore'),
    Stripe = require('stripe'),
    moment = require('moment'),
    config = require('../../util/config'),
    stripe = Stripe(config('stripe.api_key'));

function getAllEvents (allEvents, eventType, range, done) {
  var options = _({
    type: eventType,
    limit: 100
  }).extend(range);

  stripe.events.list(options, function (err, events) {
    if (err)
      done(err);
    //mrr = _(events.data).reduce(processEvent, mrr);
    allEvents.push(events.data);
    var latestEvent = _.last(events.data)
    //if (!events.has_more || !latestEvent)
    //if (!events.has_more || !latestEvent)
      return done(null, _.flatten(allEvents));

    getAllEvents(allEvents, eventType, {starting_after: latestEvent.id}, done);
  });

} 

function fetchAllCoupons (range, done) {
  

  getAllEvents([], 'customer.discount.*', range, function (err, discounts) {

    if (err)
      done(err);

    var customerDiscounts = {};
    _(discounts).each(function (discount) {
      var customerId = discount.data.object.customer,
        customerExist = customerDiscounts[customerId];

      if (!customerExist) {
        customerDiscounts[customerId] = [];
      }
      customerDiscounts[customerId].push(discount);
    });

    done(null, customerDiscounts);
  });
}



function computeMrrSince(range, customersDiscounts, done) {
  
  getAllEvents([], 'customer.subscription.*', range, function (err, subscriptions) {
    if (err)
      done(err);

    done(null, _(subscriptions).reduce(function (memo, subscription) {
      return (memo + processEvent(subscription, customersDiscounts[subscription.data.object.customer] || null));
    }, 0));
  })

}

function processEvent(event, discount) {

  var newValues = event.data.object,
      prevValues = _(event.data.previous_attributes || {}).defaults(newValues);

  var newPrice = event.type === 'customer.subscription.deleted' ? 0 : getPrice(newValues),
      prevPrice = event.type === 'customer.subscription.created' ? 0 : getPrice(prevValues);

  if (newPrice !== prevPrice) {
    console.log(
      moment.unix(event.created).toString(),
      event.type.replace('customer.subscription.', ''),
      event.data.object.plan.interval,
      //[prevValues.quantity, prevValues.plan.amount, prevValues.plan.interval].join(','),
      //[newValues.quantity, newValues.plan.amount, newValues.plan.interval].join(','),
      (newPrice - prevPrice)
    );
  }

  var price = (newPrice - prevPrice);
  if (discount)
    price = applyDiscount(price, event, discount);
  
  return price
}

function applyDiscount (price, event, discount) {

  return price;
}

function getPrice(object) {
  var price = object.quantity * (object.plan.amount / 100);

  if (object.plan.interval === 'year')
    price = price / 12;

  return price;
}

function computeMrr() {

  fetchAllCoupons({}, function (err, discounts) {

    console.log('discounts: ' + _.keys(discounts).length);

    computeMrrSince({}, discounts, function (err, mrr) {
      console.log(err, mrr);
    });

  });

}

computeMrr();