import {
  fileUtils,
  FileParser,
  Util,
  cleanSlug,
  getTemplate,
  save,
  log,
  Hooks
} from '../../cli'

var create = function(template, path, name, req, forceJson = {}) {
  var p = new Promise((resolve, reject) => {

      var templatePath = fileUtils.getTemplatePath(template)
      var filePath = fileUtils.getFilePath(fileUtils.concatPath(path, name))

      filePath = cleanSlug(filePath)
      log.write('create', '********************************************')
      log.write('create', 'cleanSlug: ' + filePath)

      if(templatePath !== null && filePath !== null) {
        var tplUrl = FileParser.getFileDataFromUrl(filePath)
        if(!fileUtils.isFile(tplUrl.json.path)) {
          log.write('create', 'json found: ' + tplUrl.json.path)
          var json = (forceJson) ? forceJson : {}
          log.write('create', 'force json: ' + ((forceJson) ? 'true' : 'false'))
          log.write('create', JSON.stringify(forceJson))
          var tpl = templatePath
          var text = getTemplate(tpl)
          text = Util.removeDataList(text)
          var resHook = Hooks.instance.trigger('beforeFirstSave', filePath, req.query, json, text)
          filePath = resHook.filePath
          json = resHook.json
          text = resHook.text

          save(filePath, req.query.selectTemplate, json, text, 'draft', null, 'draft')
            .then((resSave) => {
                log.write('create', 'success')
                filePath = resSave.htmlPath
                tplUrl = FileParser.getFileDataFromUrl(filePath)
                resolve(resSave.json)
              }).catch(function(e) {
                reject()
                log.write('create', '[ ERROR ]' + e.stack)
                console.error(e.stack)
              })
        }else {
          log.write('create', '[ INFO ] file already exist, exit')
          var json = FileParser.getJson(tplUrl.json.path)
          resolve(json, tplUrl.json.path)
        }
      }else {
        log.write('create', '[ ERROR ] cleantemplatePath is not defined')
        reject()
      }
    }).catch(function(e) {
      console.error(e.stack)
      reject()
    })

    return p
}

export default create