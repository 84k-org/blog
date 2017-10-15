import {
  cmsOperations,
  abeExtend,
  cmsData,
  Manager,
  config
} from '../../../../cli'

var route = function(req, res, next) {
  abeExtend.hooks.instance.trigger('beforeRoute', req, res, next)
  if (typeof res._header !== 'undefined' && res._header !== null) return

  var operation = cmsData.regex.getWorkflowFromOperationsUrl(req.originalUrl)

  var p = cmsOperations.post.submit(
    operation.postUrl,
    req.body.json,
    operation.workflow,
    res.user
  )

  p
    .then(
      result => {
        // Auto-republish if the config is setup and the posts limit is not reached
        if (
          operation.workflow === 'publish' &&
          config.publish['auto-republish'] &&
          config.publish['auto-republish'].active
        ) {
          var nbPosts = Manager.instance.getList().length
          if (config.publish['auto-republish'].limit >= nbPosts) {

            var generateArgs = []
            generateArgs.push(`ABE_DESTINATION=${Manager.instance.pathPublish.replace(config.root, '')}`)

            var proc = abeExtend.process('generate-posts', generateArgs, data => {
              res.app.emit('generate-posts', data)
            })
            if (proc) {
              res.app.emit('generate-posts', {percent: 0, time: '00:00sec'})
              console.log('generate-posts emitted')
            }
          }
        }

        Manager.instance.events.activity.emit('activity', {
          operation: operation.workflow,
          post: operation.postUrl,
          user: res.user
        })
        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify(result))
      },
      result => {
        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify(result))
      }
    )
    .catch(function(e) {
      console.error('[ERROR] submit.js', e)
    })
}

export default route
