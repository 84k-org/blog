'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = printJson;

/**
 * Handlebars helper, to print json object
 */
function printJson(obj, escapeString) {
  if (typeof obj !== 'undefined' && obj !== null) {
    return typeof escapeString !== null && escapeString !== null && escapeString === 1 ? escape(JSON.stringify(obj).replace(/'/g, '%27')) : JSON.stringify(obj).replace(/'/g, '%27');
  } else {
    return '{}';
  }
}