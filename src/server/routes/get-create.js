import {
  fileUtils,
  FileParser,
  Util,
  cleanSlug,
  getTemplate,
  config,
  save,
  log,
  abeCreate,
  Hooks
} from "../../cli"

var route = function(req, res, next) {
  Hooks.instance.trigger("beforeRoute", req, res, next)

  var p = abeCreate(req.query.selectTemplate, req.query.filePath, req.query.tplName, req)

  p.then((resSave) => {
    var result = {
      success: 1,
      json: resSave
    }
    res.set("Content-Type", "application/json")
    res.send(JSON.stringify(result))
  },
  () => {
    var result = {
      success: 0
    }
    res.set("Content-Type", "application/json")
    res.send(JSON.stringify(result))
  })
}

export default route