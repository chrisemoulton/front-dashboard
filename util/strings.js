var validUrl = require('valid-url');

module.exports.isUrl = function (str) {
  return validUrl.isUri(str);
};

module.exports.escapeHtml = function (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};
