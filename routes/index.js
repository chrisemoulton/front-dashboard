exports.mount = function (app) {
  require('./slack').mount(app);
};
