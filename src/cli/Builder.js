import fse from 'fs-extra'
import extend from 'extend'
import mkdirp from 'mkdirp'
import {saveHtml} from './controllers/Save'

import {
  Util,
  FileParser,
  config,
  fileUtils,
  fileAttr,
  cli,
  log,
  getTemplate,
  Page
} from './'

class Builder {

  constructor(root, folder, dest, flow){
    this.pathToJson = fileUtils.concatPath(root, config.data.url)
    var files = fileAttr.filterLatestVersion(FileParser.getFiles(this.pathToJson, config.data.url), flow)

    if(flow === 'publish') {
      files = FileParser.getFiles(fileUtils.concatPath(root, config.publish.url), new RegExp('.' + config.files.templates.extension))
      // files = FileParser.getMetas(files, 'draft')
    }

    files.forEach(function (file) {
      if(file.path.indexOf('.' + config.files.templates.extension) > -1){
        console.log(1, file.path)
        file.path = file.path.replace(config.publish.url, config.data.url)
                             .replace('.' + config.files.templates.extension, '.json')
        
        var json = fse.readJsonSync(file.path)
        var text = getTemplate(json.abe_meta.template)
        
        Util.getDataList(fileUtils.removeLast(json.abe_meta.link), text, json)
        .then(() => {
          var page = new Page(json.abe_meta.link, text, json, true)
          saveHtml(fileUtils.concatPath(root, dest + json.abe_meta.link), page.html)
          console.log(fileUtils.concatPath(root, dest + json.abe_meta.link))
        }).catch(function(e) {
          console.error(e)
        })
      }
      else if(file.path.indexOf('.json') > -1){
        var json = fse.readJsonSync(file.path)
        var text = getTemplate(json.abe_meta.template)

        Util.getDataList(fileUtils.removeLast(json.abe_meta.link), text, json)
        .then(() => {
          var page = new Page(json.abe_meta.link, text, json, true)
          saveHtml(fileUtils.concatPath(root, dest + json.abe_meta.link), page.html)
          console.log(fileUtils.concatPath(root, dest + json.abe_meta.link))
        }).catch(function(e) {
          console.error(e)
        })
      }
    })
  }

}

if(process.env.ROOT && process.env.FOLDER && process.env.DEST){
  config.set({root: process.env.ROOT})
  var dest = process.env.DEST || 'tmp'
  var flow = process.env.FLOW || 'draft'
  new Builder(process.env.ROOT, process.env.FOLDER, dest, flow)
}
