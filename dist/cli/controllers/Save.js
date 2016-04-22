'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkRequired = checkRequired;
exports.save = save;
exports.saveJson = saveJson;
exports.saveHtml = saveHtml;
exports.dateIso = dateIso;

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _xss = require('xss');

var _xss2 = _interopRequireDefault(_xss);

var _es6Promise = require('es6-promise');

var _ = require('../');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function checkRequired(text, json) {
  var regAbe = /{{abe[\S\s].*?key=['|"]([\S\s].*?['|"| ]}})/g;
  var matches = text.match(regAbe);
  var requiredValue = 0;
  var complete = 0;
  if (typeof matches !== 'undefined' && matches !== null) {
    Array.prototype.forEach.call(matches, function (match) {
      if (typeof match !== 'undefined' && match !== null) {

        var keyAttr = (0, _.getAttr)(match, 'key');
        var requiredAttr = (0, _.getAttr)(match, 'required');
        if (requiredAttr === 'true') {
          requiredValue++;

          var minAttr = (0, _.getAttr)(match, 'min-length');
          minAttr = minAttr !== '' ? minAttr : 0;

          if (typeof json[keyAttr] !== 'undefined' && json[keyAttr] !== null && json[keyAttr] !== '') {
            if (minAttr > 0) {
              if (json[keyAttr].length >= minAttr) {
                complete++;
              }
            } else {
              complete++;
            }
          } else {}
        }
      }
    });
  }

  return Math.round(requiredValue > 0 ? complete * 100 / requiredValue : 100);
}

function save(url, tplPath) {
  var json = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
  var text = arguments.length <= 3 || arguments[3] === undefined ? '' : arguments[3];
  var type = arguments.length <= 4 || arguments[4] === undefined ? '' : arguments[4];
  var previousSave = arguments.length <= 5 || arguments[5] === undefined ? null : arguments[5];
  var realType = arguments.length <= 6 || arguments[6] === undefined ? 'draft' : arguments[6];

  var p = new _es6Promise.Promise(function (resolve, reject) {
    if (type === 'reject') {
      url = _.Hooks.instance.trigger('beforeReject', url);
      type = 'draft';
      realType = 'draft';
      url = _.Hooks.instance.trigger('afterReject', url);
      resolve({ reject: _.fileAttr.delete(url).replace(_.fileUtils.concatPath(_.config.root, _.config.draft.url), '') });
    }
    var tplUrl = _.FileParser.getFileDataFromUrl(url);
    type = type || _.FileParser.getType(url);
    var path = dateIso(tplUrl, type);
    if (typeof previousSave !== 'undefined' && previousSave !== null) {
      path.jsonPath = _.fileUtils.concatPath(_.config.root, previousSave.jsonPath.replace(_.config.root, '')).replace(/-abe-d/, '-abe-' + realType[0]);
      path.htmlPath = _.fileUtils.concatPath(_.config.root, previousSave.htmlPath.replace(_.config.root, '')).replace(/-abe-d/, '-abe-' + realType[0]);
    }

    var tpl = tplPath.replace(_.config.root, '');
    var fullTpl = _.fileUtils.concatPath(_.config.root, _.config.templates.url, tpl) + '.' + _.config.files.templates.extension;

    if (typeof json === 'undefined' || json === null) {
      _.FileParser.getJson(tplUrl.json.path);
    }

    var ext = {
      template: tpl,
      link: tplUrl.publish.link,
      complete: 0,
      type: type
    };

    var meta = _.config.meta.name;
    json[meta] = (0, _extend2.default)(json[meta], ext);
    var date = _.fileAttr.get(path.jsonPath).d;
    if (typeof date === 'undefined' || date === null || date === '') {
      date = new Date();
    } else {
      date = new Date(date);
    }
    _.Util.addMetas(tpl, json, type, {}, date, realType);

    if (typeof text === 'undefined' || text === null || text === '') {
      text = (0, _.getTemplate)(fullTpl);
    }

    _.Util.getDataList(_.fileUtils.removeLast(tplUrl.publish.link), text, json).then(function () {

      var obj = {
        type: type,
        template: {
          path: fullTpl
        },
        html: {
          path: path.htmlPath
        },
        json: {
          content: json,
          path: path.jsonPath
        }
      };

      obj = _.Hooks.instance.trigger('beforeSave', obj);

      obj.json.content[meta].complete = checkRequired(text, obj.json.content);

      text = _.Util.removeDataList(text);

      var page = new _.Page(tplUrl.publish.path, text, obj.json.content, true);

      saveJson(obj.json.path, obj.json.content);
      saveHtml(obj.html.path, page.html);

      obj = _.Hooks.instance.trigger('afterSave', obj);

      _.FileParser.copySiteAssets();

      resolve({
        json: obj.json.content,
        jsonPath: obj.json.path,
        html: page.html,
        htmlPath: path.htmlPath
      });
    }).catch(function (e) {
      console.error(e.stack);
    });
  });

  return p;
}

function saveJson(url, json) {
  _mkdirp2.default.sync(_.fileUtils.removeLast(url));

  if (typeof json.abe_source !== 'undefined' && json.abe_source !== null) {
    delete json.abe_source;
  }

  json = JSON.parse((0, _xss2.default)(JSON.stringify(json).replace(/[a-zA-Z0-9-]*?=\\[\"\'].*?[\"\']/g, '')));

  _fsExtra2.default.writeJsonSync(url, json, {
    space: 2,
    encoding: 'utf-8'
  });
  _.log.delAndWrite('Index-saveJson', 'Success result writing file : ' + url, json);
}

function saveHtml(url, html) {
  _mkdirp2.default.sync(_.fileUtils.removeLast(url));
  if (_.fileAttr.test(url) && _.fileAttr.get(url).s !== 'd') {
    _.fileUtils.deleteOlderRevisionByType(_.fileAttr.delete(url), _.fileAttr.get(url).s);
  }

  _fsExtra2.default.writeFileSync(url, html);
  _.log.delAndWrite('Index-saveHtml', 'Success result writing file : ' + url, html);
}

function dateIso(tplUrl) {
  var type = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  var newDateISO;
  var dateISO;
  var validate;

  var saveJsonFile = tplUrl.json.path;
  var saveFile = tplUrl['draft'].path;
  var oldDateISO = _.fileAttr.get(saveFile).d;

  switch (type) {
    case 'draft':
      newDateISO = new Date().toISOString();
      dateISO = 'd' + newDateISO;
      break;
    case 'publish':
      saveJsonFile = tplUrl.publish.json;
      saveFile = tplUrl.publish.path;
      break;
    default:
      newDateISO = new Date().toISOString();
      dateISO = type[0] + newDateISO;
      break;
  }

  if (dateISO) {
    saveJsonFile = _.fileAttr.add(saveJsonFile, dateISO);
    saveFile = _.fileAttr.add(saveFile, dateISO);
  }

  return {
    jsonPath: saveJsonFile,
    htmlPath: saveFile
  };
}