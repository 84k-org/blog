'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cli = require('../../cli');

var route = function route(req, res, next) {
  _cli.Hooks.instance.trigger('beforeRoute', req, res, next);

  log.write('create', '********************************************');
  log.write('create', 'selectTemplate: ' + req.query.selectTemplate);
  log.write('create', 'filePath: ' + req.query.filePath);
  log.write('create', 'tplName: ' + req.query.tplName);
  var p = (0, _cli.abeCreate)(req.query.selectTemplate, req.query.filePath, req.query.tplName, req);

  p.then(function (resSave) {
    log.write('create', 'success');
    var result = {
      success: 1,
      json: resSave
    };
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
  }, function () {
    var result = {
      success: 0
    };
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
  });
};

exports.default = route;