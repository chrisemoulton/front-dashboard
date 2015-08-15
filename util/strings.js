var url = require('url');

module.exports.isUrl = function (str) {
  try {
    url.parse(str);
    return true;
  }
  catch (e) {}

  return false;
};

module.exports.escapeHtml = function (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};
