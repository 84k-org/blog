import {
  cmsOperations
  ,abeExtend
  ,cmsData
} from '../../../../cli'

var route = function(req, res, next){
  abeExtend.hooks.instance.trigger('beforeRoute', req, res, next)
  if(typeof res._header !== 'undefined' && res._header !== null) return

  var operation = req.originalUrl.replace(/\/abe\/operations\/unpublish\//, '')

  cmsOperations.post.unpublish(operation.postUrl)

  var result = {
    success: 1,
    file: operation.postUrl
  }
  res.set('Content-Type', 'application/json')
  res.send(JSON.stringify(result))
}

export default route