import {
  abeDuplicate,
  log,
  Hooks
} from '../../cli'

var route = function(req, res, next) {
    Hooks.instance.trigger('beforeRoute', req, res, next)

    var p = abeDuplicate(req.query.oldFilePath, req.query.selectTemplate, req.query.filePath, req.query.tplName, req, true)

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
  }).catch(function(e) {
      reject()
      console.error(e)
  })
}

export default route