'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cli = require('../../cli');

var _RedisClient = require('../services/RedisClient');

var redis = _interopRequireWildcard(_RedisClient);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var singleton = Symbol();
var singletonEnforcer = Symbol();

var Manager = function () {
  function Manager(enforcer) {
    _classCallCheck(this, Manager);

    if (enforcer != singletonEnforcer) throw 'Cannot construct Json singleton';

    _handlebars2.default.templates = _handlebars2.default.templates || {};
    this.loadHbsTemplates();
  }

  _createClass(Manager, [{
    key: 'getList',
    value: function getList() {
      if (_cli.config.redis.enable) {
        redis.get().get('list', function (err, reply) {
          this._list = JSON.parse(reply);
        });
      }

      return this._list;
    }
  }, {
    key: 'setList',
    value: function setList(list) {
      if (_cli.config.redis.enable) {
        redis.get().set('list', JSON.stringify(list));
      }
      this._list = list;

      return this;
    }
  }, {
    key: 'init',
    value: function init() {
      var _this = this;

      this._whereKeys = [];
      var p = new Promise(function (resolve, reject) {
        _this._loadTime = new _cli.TimeMesure('Loading Manager');
        var pathTemplate = _path2.default.join(_cli.config.root, _cli.config.templates.url);
        (0, _cli.getSelectTemplateKeys)(pathTemplate).then(function (whereKeys) {
          _this._whereKeys = whereKeys;
          _this.updateList();
          resolve();
        }, function (e) {
          console.log('Manager._init', e);
        }).catch(function (e) {
          console.log('Manager._init', e);
        });
      });

      return p;
    }
  }, {
    key: 'updateList',
    value: function updateList() {
      if (typeof this._loadTime === 'undefined' || this._loadTime === null) {
        this._loadTime = new _cli.TimeMesure('Loading Manager');
      }
      this._list = _cli.FileParser.getAllFilesWithKeys(this._whereKeys);
      this._list.sort(_cli.FileParser.predicatBy('date', -1));
      if (_cli.config.redis.enable) {
        redis.get().set('list', JSON.stringify(this._list));
      }
      this._loadTime.duration();
      delete this._loadTime;

      return this;
    }
  }, {
    key: 'addHbsTemplate',
    value: function addHbsTemplate(templateId) {
      var pathTemplate = _path2.default.join(_cli.config.root, _cli.config.templates.url, 'hbs', templateId) + '.hbs';
      var tmpl = eval('(function(){return ' + _fsExtra2.default.readFileSync(pathTemplate) + '}());');
      _handlebars2.default.templates[templateId] = _handlebars2.default.template(tmpl);
    }
  }, {
    key: 'loadHbsTemplates',
    value: function loadHbsTemplates() {
      var pathTemplate = _path2.default.join(_cli.config.root, _cli.config.templates.url, 'hbs');

      if (!_cli.folderUtils.isFolder(pathTemplate)) {
        _mkdirp2.default.sync(pathTemplate);
      }

      _fsExtra2.default.readdirSync(pathTemplate).forEach(function (file) {
        if (file.indexOf('.hbs') > -1) {
          var originalTemplatePath = _path2.default.join(_cli.config.root, _cli.config.templates.url) + '/' + file.replace('.hbs', '.' + _cli.config.files.templates.extension);

          try {
            var originalTemplateStat = _fsExtra2.default.statSync(originalTemplatePath);
            var originalTemplateMdate = originalTemplateStat.mtime;
            var stat = _fsExtra2.default.statSync(_path2.default.join(pathTemplate, file));
            var mdate = stat.mtime;

            // if the original template has been updated after precompilation, I delete the precompiled file
            // else I add it to the hbs template array
            if (originalTemplateMdate > mdate) {
              _fsExtra2.default.unlinkSync(_path2.default.join(pathTemplate, file));
            } else {
              var tmpl = eval('(function(){return ' + _fsExtra2.default.readFileSync(_path2.default.join(pathTemplate, file)) + '}());');
              _handlebars2.default.templates[file.replace('.hbs', '')] = _handlebars2.default.template(tmpl);
            }
          } catch (err) {
            console.log('The original template has not been found or the hbs template is corrupted');
            console.log(originalTemplatePath);
            console.log(err);
          }
        }
      });
    }
  }], [{
    key: 'instance',
    get: function get() {
      if (!this[singleton]) {
        this[singleton] = new Manager(singletonEnforcer);
      }
      return this[singleton];
    }
  }]);

  return Manager;
}();

exports.default = Manager;