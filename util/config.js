var config = require('config');

module.exports = function (key) {
  return process.env[key] || config.get(key);
};
