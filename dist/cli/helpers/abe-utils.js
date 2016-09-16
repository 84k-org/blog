'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _loremIpsum = require('lorem-ipsum');

var _loremIpsum2 = _interopRequireDefault(_loremIpsum);

var _cliColor = require('cli-color');

var _cliColor2 = _interopRequireDefault(_cliColor);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _ajaxRequest = require('ajax-request');

var _ajaxRequest2 = _interopRequireDefault(_ajaxRequest);

var _es6Promise = require('es6-promise');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ = require('../');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);

    this._form = {};
    this._key = [];
  }

  /**
   * Get all input from a template
   * @return {Array} array of input form
   */


  _createClass(Utils, [{
    key: 'dontHaveKey',


    /**
     * Check if key is not is the form array
     * @param  {[type]} key [description]
     * @return {[type]}     [description]
     */
    value: function dontHaveKey(key) {
      return typeof this._key[key] === "undefined" || this._key[key] === null;
    }

    /**
     * Add entry to abe engine form
     * @param {String} type        textarea | text | meta | link | image | ...
     * @param {String} key         unique ID, no space allowed
     * @param {String} desc        input description
     * @param {Int}    maxLength   maximum characteres allowed inside input
     * @param {String} tab         tab name
     * @param {String} jsonValue   
     * @return {Void}
     */

  }, {
    key: 'add',
    value: function add(obj) {
      var defaultValues = {
        type: 'text',
        key: '',
        desc: '',
        maxLength: null,
        tab: 'default',
        placeholder: '',
        value: '',
        source: null,
        display: null,
        reload: false,
        order: 0,
        required: false,
        editable: true,
        visible: true,
        block: ''
      };

      obj = (0, _extend2.default)(true, defaultValues, obj);
      obj.tab = typeof obj.tab !== 'undefined' && obj.tab !== null && obj.tab !== '' ? obj.tab : 'default';

      obj.reload = typeof obj.reload !== 'undefined' && obj.reload !== null && obj.reload === 'true' ? true : false, obj.key = obj.key.replace(/\./, '-');

      if (obj.key.indexOf('[') < 0 && obj.key.indexOf('.') > -1) {
        obj.block = obj.key.split('.')[0];
      }

      if (typeof this._form[obj.tab] === 'undefined' || this._form[obj.tab] === null) this._form[obj.tab] = { item: [] };

      this._key[obj.key] = true; // save key for dontHaveKey()
      this._form[obj.tab].item.push(obj);
    }
  }, {
    key: 'isBlock',
    value: function isBlock(str) {
      return str.indexOf('[') < 0 && str.indexOf('.') > 0;
    }

    /**
     * Test if a string don't contains string key from ABE block statement
     * @param  {String}  str string to test
     * @return {Boolean} true = this is not a block content
     */

  }, {
    key: 'isSingleAbe',
    value: function isSingleAbe(str, text) {
      return !new RegExp('#each(.)+?' + (0, _.getAttr)(str, 'key').split('.')[0]).test(text) && str.indexOf('{{#') < 0 && str.indexOf('#each') < 0 && str.indexOf('{{/') < 0 && str.indexOf('/each') < 0 && str.indexOf('attrAbe') < 0;
    }

    /**
     * Test if a string contains string key from ABE block statement
     * @param  {String}  str string to test
     * @return {Boolean} true = this is a block content
     */

  }, {
    key: 'isBlockAbe',
    value: function isBlockAbe(str) {
      return str.indexOf('abe') > -1 && (0, _.getAttr)(str, 'key').indexOf('.') > -1;
    }

    /**
     * Test if a string contains string key from {{#each}} block statement
     * @param  {String}  str string to test
     * @return {Boolean} true = this is a block content
     */

  }, {
    key: 'isEachStatement',
    value: function isEachStatement(str) {
      return str.indexOf('#each') > -1 || str.indexOf('/each') > -1;
    }

    /**
     * Encode / Escape && add data-abe attributs
     * @param  {String} block
     * @return {String} escaped string
     */

  }, {
    key: 'encodeAbe',
    value: function encodeAbe(block) {
      var matchAbe = block.match(/>\s*\{\{abe .*\}\}/g);
      if (matchAbe) {
        for (var i = 0; i < matchAbe.length; i++) {
          var getattr = (0, _.getAttr)(matchAbe[i], 'key').replace('.', '[0]-');
          block = block.replace(matchAbe[i], ' data-abe-' + this.validDataAbe(getattr) + '="' + getattr + '" >');
        }
      }
      matchAbe = block.match(/( [A-Za-z0-9\-\_]+="*{{.*?}})/g);
      if (matchAbe) {
        for (var i = 0; i < matchAbe.length; i++) {
          if (typeof matchAbe !== 'undefined' && matchAbe !== null) {
            var getattr = (0, _.getAttr)(matchAbe[i], 'key').replace('.', '[0]-');
            var matchattr = matchAbe[i].split('=')[0].trim();
            block = block.replace(matchAbe[i], ' data-abe-attr-' + this.validDataAbe(getattr) + '="' + matchattr + '"' + ' data-abe-' + this.validDataAbe(getattr) + '="' + getattr + '" ' + matchAbe[i]).replace(/\{\{\abe.*?}\}/, '');
          }
        }
      }
      return escape(block);
    }

    /**
     * Add some stuff like style / script before closing </body> tag
     * @param  {String} text html page
     * @return {String} text + some sugar stuff added on the fly
     */

  }, {
    key: 'insertDebugtoolUtilities',
    value: function insertDebugtoolUtilities(text) {
      return text.replace(/<\/body>/, '<style>\n          body [data-abe]{ transition: box-shadow 600ms ease-in-out; box-shadow: 0; }\n          body .select-border{ border-color: #007CDE; box-shadow: 0 3px 13px #7CBAEF; }\n          body img.display-attr:before { content: attr(alt); }\n          body a.display-attr:before { content: attr(title); }\n          body .display-attr:before { position: absolute; display: block; z-index: 555; font-size: 10px; background-color: rgba(255, 255, 255, 0.75); padding: 2px 5px; color: #5D5D5D; }\n          .hidden-abe{ display: none!important; width: 0px !important; height: 0px!important; position: absolute; left: -10000px; top: -10000px; visibility: hidden;}\n        </style>\n      </body>');
    }
  }, {
    key: 'validDataAbe',
    value: function validDataAbe(str) {
      return str.replace(/\[([0-9]*)\]/g, '$1');
    }
  }, {
    key: 'lorem',
    value: function lorem(type, v) {
      var lorem = '';
      if (type === 'text') {
        lorem = (0, _loremIpsum2.default)({
          units: 'sentences' // Generate words, sentences, or paragraphs.
          , sentenceLowerBound: 5,
          sentenceUpperBound: 10
        });
      } else if (type === 'link') {
        lorem = 'http://www.google.com';
      } else if (type === 'image' || type === 'file') {
        var width = (0, _.getAttr)(v, 'width');
        width = width !== '' ? width : 300;
        var height = (0, _.getAttr)(v, 'height');
        height = height !== '' ? height : 300;
        lorem = 'http://placehold.it/' + height + 'x' + width;
      } else if (type === 'textarea' || type === 'rich') {
        lorem = (0, _loremIpsum2.default)({
          units: 'paragraphs' // Generate words, sentences, or paragraphs.
          , paragraphLowerBound: 3,
          paragraphUpperBound: 7
        });
      }
      return lorem;
    }
  }, {
    key: 'form',
    get: function get() {
      return this._form;
    }
  }], [{
    key: 'escapeRegExp',
    value: function escapeRegExp(str) {
      var specials = [
      // order matters for these
      "-", "[", "]"
      // order doesn't matter for any of these
      , "/", "{", "}", "(", ")", "*", "+", "?", ".", "\\", "^", "$", "|"]

      // I choose to escape every character with '\'
      // even though only some strictly require it when inside of []
      ,
          regex = RegExp('[' + specials.join('\\') + ']', 'g');
      return str.replace(regex, "\\$&");
    }
  }, {
    key: 'addMetas',
    value: function addMetas(tpl, json, type) {
      var obj = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
      var date = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];
      var realType = arguments.length <= 5 || arguments[5] === undefined ? 'draft' : arguments[5];

      var meta = _.config.meta.name;

      json[meta] = (0, _extend2.default)({}, json[meta]);
      var currentDate = typeof date !== 'undefined' && date !== null && date !== '' ? date : new Date();
      var abeUrl = type === 'publish' ? json[meta].link : _.fileAttr.add(json[meta].link, 'd' + (0, _.dateSlug)(currentDate.toISOString())) + '';

      if (typeof json[meta].date === 'undefined' || json[meta].date === null) {
        json[meta].date = currentDate;
      }
      json[meta].latest = {
        date: currentDate,
        abeUrl: abeUrl
      };
      json[meta].status = realType === 'reject' ? 'draft' : realType;
      if (typeof json[meta][type] === 'undefined' || json[meta][type] === null) {
        json[meta][type] = JSON.parse(JSON.stringify(obj));
        json[meta][type].date = currentDate;
        json[meta][type].abeUrl = abeUrl;
      }
      json[meta][type].latest = JSON.parse(JSON.stringify(obj));
      json[meta][type].latest.date = currentDate;
      json[meta][type].latest.abeUrl = abeUrl;
    }
  }, {
    key: 'sanitizeSourceAttribute',
    value: function sanitizeSourceAttribute(obj, jsonPage) {
      if (typeof obj.sourceString !== 'undefined' && obj.sourceString !== null && obj.sourceString.indexOf('{{') > -1) {
        var matches = obj.sourceString.match(/({{[a-zA-Z._]+}})/g);
        if (matches !== null) {
          Array.prototype.forEach.call(matches, function (match) {
            var val = match.replace('{{', '');
            val = val.replace('}}', '');
            val = _.Sql.deep_value_array(jsonPage, val);
            if (typeof val === 'undefined' || val === null) {
              val = '';
            }
            obj.sourceString = obj.sourceString.replace(match, val);
          });
        }
      }

      return obj;
    }
  }, {
    key: 'getDataList',
    value: function getDataList(tplPath, text, jsonPage) {

      var p = new _es6Promise.Promise(function (resolve, reject) {
        var listReg = /({{abe.*type=[\'|\"]data.*}})/g;
        var match;
        var sourceAttr = _.config.source.name;

        if (typeof jsonPage[sourceAttr] === 'undefined' || jsonPage[sourceAttr] === null) {
          jsonPage[sourceAttr] = {};
        }

        var promises = [];
        while (match = listReg.exec(text)) {
          var logTime = tplPath + " > " + match[0];
          var dateStart = new Date();

          var pSource = new _es6Promise.Promise(function (resolveSource, rejectSource) {
            var obj = Utils.getAllAttributes(match[0], jsonPage);
            obj = Utils.sanitizeSourceAttribute(obj, jsonPage);

            var type = _.Sql.getSourceType(obj.sourceString);

            switch (type) {
              case 'request':
                _.Sql.executeQuery(tplPath, match[0], jsonPage).then(function (data) {
                  jsonPage[sourceAttr][obj.key] = data;
                  if (!obj.editable) {
                    if (obj.maxLength) {
                      jsonPage[obj.key] = data.slice(0, obj.maxLength);
                    } else {
                      jsonPage[obj.key] = data;
                    }
                  } else if (obj.prefill) {
                    if (obj.prefillQuantity && obj.maxLength) {
                      jsonPage[obj.key] = data.slice(0, obj.prefillQuantity > obj.maxLength ? obj.maxLength : obj.prefillQuantity);
                    } else if (obj.prefillQuantity) {
                      jsonPage[obj.key] = data.slice(0, obj.prefillQuantity);
                    } else if (obj.maxLength) {
                      jsonPage[obj.key] = data.slice(0, obj.maxLength);
                    } else {
                      jsonPage[obj.key] = data;
                    }
                  }

                  _.log.duration(type + " > " + logTime, (new Date().getTime() - dateStart.getTime()) / 1000);

                  resolveSource();
                });

                break;
              case 'value':
                var value = _.Sql.getDataSource(match[0]);

                if (value.indexOf('{') > -1 || value.indexOf('[') > -1) {
                  try {
                    value = JSON.parse(value);

                    jsonPage[sourceAttr][obj.key] = value;
                  } catch (e) {
                    jsonPage[sourceAttr][obj.key] = null;
                    console.log(_cliColor2.default.red('Error ' + value + '/is not a valid JSON'), '\n' + e);
                  }
                }
                resolveSource();
                break;
              case 'url':
                if (obj.autocomplete !== true && obj.autocomplete !== 'true') {
                  var host = obj.sourceString;
                  host = host.split('/');
                  var httpUse = _http2.default;
                  var defaultPort = 80;
                  if (host[0] === 'https:') {
                    httpUse = _https2.default;
                    defaultPort = 443;
                  }
                  host = host[2].split(':');

                  var pathSource = obj.sourceString.split('//');
                  if (typeof pathSource[1] !== 'undefined' && pathSource[1] !== null) {
                    pathSource = pathSource[1].split('/');
                    pathSource.shift();
                    pathSource = '/' + _path2.default.join('/');
                  } else {
                    pathSource = '/';
                  }
                  var options = {
                    hostname: host[0],
                    port: typeof host[1] !== 'undefined' && host[1] !== null ? host[1] : defaultPort,
                    path: pathSource,
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Content-Length': 0
                    }
                  };

                  var body = '';

                  var localReq = httpUse.request(options, function (localRes) {
                    localRes.setEncoding('utf8');
                    localRes.on('data', function (chunk) {
                      body += chunk;
                    });
                    localRes.on('end', function () {
                      try {
                        if (typeof body === 'string') {
                          var parsedBody = JSON.parse(body);
                          if ((typeof parsedBody === 'undefined' ? 'undefined' : _typeof(parsedBody)) === 'object' && Object.prototype.toString.call(parsedBody) === '[object Array]') {
                            jsonPage[sourceAttr][obj.key] = parsedBody;
                          } else if ((typeof parsedBody === 'undefined' ? 'undefined' : _typeof(parsedBody)) === 'object' && Object.prototype.toString.call(parsedBody) === '[object Object]') {
                            jsonPage[sourceAttr][obj.key] = [parsedBody];
                          }
                        } else if ((typeof body === 'undefined' ? 'undefined' : _typeof(body)) === 'object' && Object.prototype.toString.call(body) === '[object Array]') {
                          jsonPage[sourceAttr][obj.key] = body;
                        } else if ((typeof body === 'undefined' ? 'undefined' : _typeof(body)) === 'object' && Object.prototype.toString.call(body) === '[object Object]') {
                          jsonPage[sourceAttr][obj.key] = body;
                        }
                      } catch (e) {
                        console.log(_cliColor2.default.red('Error ' + obj.sourceString + ' is not a valid JSON'), '\n' + e);
                      }
                      resolveSource();
                    });
                  });

                  localReq.on('error', function (e) {
                    console.log(e);
                  });

                  // write data to request body
                  localReq.write('');
                  localReq.end();
                } else {
                  jsonPage[sourceAttr][obj.key] = obj.sourceString;
                  resolveSource();
                }

                break;
              case 'file':
                jsonPage[sourceAttr][obj.key] = _.FileParser.getJson(_path2.default.join(_.config.root, obj.sourceString));
                resolveSource();
                break;
              default:
                resolveSource();
                break;
            }
          });
          promises.push(pSource);
        }

        _es6Promise.Promise.all(promises).then(function () {
          resolve();
        }).catch(function (e) {
          console.error('getDataList', e);
        });
        // return filesRequest
      }).catch(function (e) {
        console.error('getDataList', e);
      });

      return p;
    }
  }, {
    key: 'removeDataList',
    value: function removeDataList(text) {
      var listReg = /({{abe.*type=[\'|\"]data.*}})/g;

      return text.replace(listReg, '');
    }
  }, {
    key: 'replaceUnwantedChar',
    value: function replaceUnwantedChar(str) {
      var chars = { "’": '', "'": '', '\"': '', 'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z', 'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'A', 'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'Þ': 'B', 'ß': 'Ss', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'a', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'œ': 'oe', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ð': 'o', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ý': 'y', 'þ': 'b', 'ÿ': 'y' };
      for (var prop in chars) {
        str = str.replace(new RegExp(prop, 'g'), chars[prop]);
      }return str;
    }
  }, {
    key: 'getAllAttributes',
    value: function getAllAttributes(str, json) {
      str = _.Hooks.instance.trigger('beforeAbeAttributes', str, json);

      var defaultValues = {
        type: 'text',
        prefill: false,
        prefillQuantity: null,
        key: '',
        desc: '',
        maxLength: null,
        tab: 'default',
        value: '',
        source: null,
        autocomplete: null,
        display: null,
        reload: false,
        order: 0,
        required: false,
        editable: true,
        visible: true
      };

      var source = (0, _.getAttr)(str, 'source');
      var key = (0, _.getAttr)(str, 'key');

      var obj = {
        type: (0, _.getAttr)(str, 'type'),
        key: key,
        prefill: (0, _.getAttr)(str, 'prefill'),
        prefillQuantity: (0, _.getAttr)(str, 'prefill-quantity'),
        desc: (0, _.getAttr)(str, 'desc'),
        autocomplete: (0, _.getAttr)(str, 'autocomplete'),
        maxLength: (0, _.getAttr)(str, 'max-length'),
        value: json[key],
        tab: (0, _.getAttr)(str, 'tab'),
        sourceString: typeof source !== 'undefined' && source !== null && source !== '' ? source : null,
        source: typeof source !== 'undefined' && source !== null && source !== '' ? typeof json[_.config.source.name] !== 'undefined' && json[_.config.source.name] !== null && json[_.config.source.name] !== '' ? json[_.config.source.name][key] : null : null,
        display: (0, _.getAttr)(str, 'display'),
        reload: (0, _.getAttr)(str, 'reload'),
        order: (0, _.getAttr)(str, 'order'),
        required: (0, _.getAttr)(str, 'required'),
        visible: (0, _.getAttr)(str, 'visible'),
        editable: (0, _.getAttr)(str, 'editable')
      };
      obj = (0, _extend2.default)(true, defaultValues, obj);

      obj.editable = typeof obj.editable === 'undefined' || obj.editable === null || obj.editable === '' || obj.editable === 'false' ? false : true;
      obj.prefill = typeof obj.prefill !== 'undefined' && obj.prefill !== null && obj.prefill === 'true' ? true : false;
      obj.prefillQuantity = typeof obj.prefillQuantity !== 'undefined' && obj.prefillQuantity !== null && obj.prefillQuantity !== '' ? obj.prefillQuantity : false;

      obj = _.Hooks.instance.trigger('afterAbeAttributes', obj, str, json);

      return obj;
    }
  }]);

  return Utils;
}();

exports.default = Utils;