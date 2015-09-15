exports.mount = function (app) {
  require('./gecko').mount(app);
  require('./slack').mount(app);
  require('./alarms').mount(app);
};
