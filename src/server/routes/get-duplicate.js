import {
  serveSite,
  fileUtils,
  FileParser,
  Util,
  cleanSlug,
  getTemplate,
  config,
  save,
  Hooks
} from '../../cli'

var route = function(req, res, next) {
  Hooks.instance.trigger('beforeRoute', req, res, next)

	var p = new Promise((resolve, reject) => {

	  var templatePath = fileUtils.getTemplatePath(req.query.selectTemplate)
	  var filePath = fileUtils.getFilePath(fileUtils.concatPath(req.query.filePath, req.query.tplName))

	  filePath = cleanSlug(filePath)

		if(templatePath !== null && filePath !== null) {
			var tplUrl = FileParser.getFileDataFromUrl(filePath)
      if(!fileUtils.isFile(tplUrl.json.path)) {
        var json = {}
        var tpl = templatePath
        var text = getTemplate(tpl)
        text = Util.removeDataList(text)
        var resHook = Hooks.instance.trigger('beforeFirstSave', filePath, req.query, json, text)
        filePath = resHook.filePath
        json = resHook.json
        text = resHook.text
        save(filePath, req.query.selectTemplate, json, text, 'draft', null, 'draft')
          .then((resSave) => {
              filePath = resSave.htmlPath
              tplUrl = FileParser.getFileDataFromUrl(filePath)
              resolve(resSave.json)
            }).catch(function(e) {
            	reject()
              console.error(e.stack)
            })
      }else {
      	var json = FileParser.getJson(tplUrl.json.path)
        resolve(json)
      }
		}else {
      reject()
    }
  }).catch(function(e) {
    console.error(e.stack)
    reject()
  })

  p.then((resSave) => {
  	var result = {
      success: 1,
      json: resSave
    }
		res.set('Content-Type', 'application/json')
		res.send(JSON.stringify(result))
  },
  () => {
  	var result = {
      success: 0
    }
		res.set('Content-Type', 'application/json')
		res.send(JSON.stringify(result))
  })
}

export default route