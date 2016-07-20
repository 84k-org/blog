import express from 'express'
import fs from 'fs'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import {minify} from 'html-minifier'
import extend from 'extend'
import * as abe from '../../cli'
import xss from 'xss'
import pkg from '../../../package'

import {
  fileAttr,
  save,
  getAttr, getEnclosingTags, escapeTextToRegex,
  Util,
  FileParser,
  fileUtils,
  folderUtils,
  config,
  cli,
  log,
  Page,
  Locales,
  abeProcess,
  getTemplate,
  Hooks,
  Plugins,
  Handlebars,
  cleanSlug
} from '../../cli'

import {editor} from '../controllers/editor'
import locale from '../helpers/abe-locale'

var page = function (req, res, next) {
  var templatePath = fileUtils.getTemplatePath(req.params[0])
  var filePath = cleanSlug(req.query.filePath)
  filePath = fileUtils.getFilePath(filePath)
  var html = (req.query.html) ? true : false
  var json = null
  var editor = false
  if(typeof req.body.json !== 'undefined' && req.body.json !== null) {
    editor = true
    if(typeof req.body.json === 'string') {
      json = JSON.parse(req.body.json)
    }else {
      json = req.body.json
    }
  }

  if(typeof filePath !== 'undefined' && filePath !== null) {

    if(!fileAttr.test(filePath)) {
      var folderFilePath = filePath.split('/')
      folderFilePath.pop()
      folderFilePath = fileUtils.pathWithRoot(folderFilePath.join('/'))
      mkdirp.sync(folderFilePath)
      var files = FileParser.getFiles(folderFilePath, true, 2)
      var latest = fileAttr.filterLatestVersion(fileAttr.getFilesRevision(files, filePath), 'draft')
      if(latest.length) {
        filePath = latest[0].path
      }
    }

    var tplUrl = FileParser.getFileDataFromUrl(filePath)
    
    if(typeof json === 'undefined' || json === null) {
      json = FileParser.getJson(tplUrl.json.path)
    }
    
    let meta = config.meta.name
    let extension = config.files.templates.extension

    var template = ''
    if(typeof json[meta] !== 'undefined' && json[meta] !== null && json[meta] !== ''
      && json[meta].template !== 'undefined' && json[meta].template !== null && json[meta].template !== '') {
      template = json[meta].template
    }else {
      template = fileUtils.getTemplatePath(req.params[0])
    }
    var text = getTemplate(template)

    if (!editor) {

      Util.getDataList(fileUtils.removeLast(tplUrl.publish.link), text, json)
        .then(() => {
          var page = new Page(templatePath, text, json, html)
          res.set('Content-Type', 'text/html')
          res.send(page.html)
        }).catch(function(e) {
          console.error(e)
        })
    }else {
      text = Util.removeDataList(text)
      var page = new Page(templatePath, text, json, html)
      res.set('Content-Type', 'text/html')
      res.send(page.html)
    }
  }else {
    // not 404 page if tag abe image upload into each block
    if(/upload%20image/g.test(req.url)) {
      var b64str = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
      var img = new Buffer(b64str, 'base64');

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': img.length
      });
      res.end(img); 
    }else {
      res.status(404).send('Not found');
    }
  }
}

export default page