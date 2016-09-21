'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cli = require('../../cli');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var duplicate = function duplicate(oldFilePath, template, newPath, name, req) {
  var isUpdate = arguments.length <= 5 || arguments[5] === undefined ? false : arguments[5];

  var p = new Promise(function (resolve, reject) {
    _cli.Hooks.instance.trigger('beforeDuplicate', oldFilePath, template, newPath, name, req, isUpdate);

    if (typeof oldFilePath !== 'undefined' && oldFilePath !== null) {
      var url = _path2.default.join(_cli.config.root, _cli.config.draft.url, oldFilePath);
      var revisions = [];

      if (!_cli.fileAttr.test(url)) {
        var folderFilePath = url.split('/');
        folderFilePath.pop();
        folderFilePath = _cli.fileUtils.pathWithRoot(folderFilePath.join('/'));

        var files = _cli.FileParser.getFiles(folderFilePath, true, 2);
        revisions = _cli.fileAttr.getFilesRevision(files, url);
        var latest = _cli.fileAttr.filterLatestVersion(revisions, 'draft');
        if (latest.length) {
          url = latest[0].path;
        }
      } else if (isUpdate) {
        files = _cli.FileParser.getFiles(folderFilePath, true, 2);
        revisions = _cli.fileAttr.getFilesRevision(files, url);
      }

      var tplUrl = _cli.FileParser.getFileDataFromUrl(url);
      if (!_cli.fileUtils.isFile(tplUrl.json.path)) {} else {}
      var json = _cli.FileParser.getJson(tplUrl.json.path);
      delete json.abe_meta;
    }

    if (isUpdate) {
      _cli.Hooks.instance.trigger('beforeUpdate', json, oldFilePath, template, newPath, name, req, isUpdate);
      Array.prototype.forEach.call(revisions, function (revision) {
        if (typeof revision.path !== 'undefined' && revision.path !== null) {
          _cli.FileParser.deleteFile(revision.path);
        }
      });
    }
    _cli.Hooks.instance.trigger('afterDuplicate', json, oldFilePath, template, newPath, name, req, isUpdate);

    var pCreate = (0, _cli.abeCreate)(template, newPath, name, req, json, isUpdate ? false : true);
    pCreate.then(function (resSave) {
      resolve(resSave);
    }, function () {
      reject();
    }).catch(function (e) {
      console.error(e);
      reject();
    });
  });

  return p;
};

exports.default = duplicate;