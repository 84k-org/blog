'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _cli = require('../../cli');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var route = function route(req, res, next) {
  _cli.Hooks.instance.trigger('beforeRoute', req, res, next);
  if (typeof res._header !== 'undefined' && res._header !== null) return;

  var resp = { success: 1 };
  var filePath;
  var fstream;
  var folderWebPath = '/' + _cli.config.upload.image;
  folderWebPath = _cli.Hooks.instance.trigger('beforeSaveImage', folderWebPath, req);
  var folderFilePath = _cli.fileUtils.concatPath(_cli.config.root, _cli.config.publish.url, folderWebPath);
  _mkdirp2.default.sync(folderFilePath);
  req.pipe(req.busboy);
  var size = 0;
  var hasError = false;
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var ext = filename.split('.');
    ext = ext[ext.length - 1].toLowerCase();
    file.fileRead = [];

    var returnErr = function returnErr(msg) {
      file.resume();
      hasError = true;
      res.set('Content-Type', 'application/json');
      res.send(JSON.stringify({ error: 1, response: msg }));
    };

    file.on('limit', function () {
      req.unpipe(req.busboy);
      returnErr('file to big');
    });

    file.on('data', function (chunk) {
      file.fileRead.push(chunk);
    });

    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png' && mimetype !== 'image/svg+xml') {
      returnErr('unauthorized file');
    } else if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png' && ext !== 'svg') {
      returnErr('not an image');
    }

    file.on('end', function () {
      if (hasError) return;
      var ext = filename.split('.');
      ext = ext[ext.length - 1];
      var randID = '-' + ((1 + Math.random()) * 0x100000 | 0).toString(16).substring(2);
      var cleanFileName = (0, _cli.cleanSlug)(filename).replace('.' + _cli.config.files.templates.extension, randID + '.' + ext);

      filePath = _cli.fileUtils.concatPath(folderFilePath, cleanFileName);
      var createImage = function createImage() {
        try {
          var sfStat = _fsExtra2.default.statSync(filePath);

          if (sfStat) {
            var nb = filePath.match(/_([0-9]).(jpg|png|gif|svg)/);
            if (nb && nb[1]) filePath = filePath.replace(/_([0-9])\.(jpg|png|gif|svg)/, '_' + (parseInt(nb[1]) + 1) + '.$2');else filePath = filePath.replace(/\.(jpg|png|gif|svg)/, '_1.$1');
            createImage();
          }
        } catch (e) {
          resp['filePath'] = _cli.fileUtils.concatPath(folderWebPath, cleanFileName);
          fstream = _fsExtra2.default.createWriteStream(filePath);
          for (var i = 0; i < file.fileRead.length; i++) {
            fstream.write(file.fileRead[i]);
          }
          fstream.on('close', function () {});
        }
      };

      createImage();
    });
  });
  req.busboy.on('finish', function () {
    if (hasError) return;
    var triesAllowed = 6;
    var interval = setInterval(function () {
      tryUpload();
    }, 100);
    var tryUpload = function tryUpload() {
      if (triesAllowed-- <= 0) {
        clearInterval(interval);
        return;
      }
      try {
        var openFile = _fsExtra2.default.readFileSync(filePath).toString();
        if (openFile === '') throw new Error('');
        clearInterval(interval);
        resp = _cli.Hooks.instance.trigger('afterSaveImage', resp, req);
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(resp));
      } catch (e) {}
    };
    tryUpload();
  });
};

exports.default = route;