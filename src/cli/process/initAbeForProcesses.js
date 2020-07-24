import extend from 'extend'
import moment from 'moment'
import debug from 'debug'

var Manager = require('../../cli').Manager
var Handlebars = require('../../cli').Handlebars
var config = require('../../cli').config
var abeExtend = require('../../cli').abeExtend

export var log
export var trace
export var error
export var processConfig
export var dateStart

export function getTime() {
  return moment(moment() - dateStart).format('mm:ss') + 'sec'
}

export async function init(processName, conf) {
  log = debug(processName + ':log')
  log.color = 2
  trace = debug(processName + ':trace')
  error = debug(processName + ':error')
  error.color = 1

  processConfig = {}
  Array.prototype.forEach.call(process.argv, item => {
    if (item.indexOf('=') > -1) {
      var ar = item.split('=')
      processConfig[ar[0]] = ar[1]
    }
  })
  if (processConfig.ABE_WEBSITE) {
    config.set({root: processConfig.ABE_WEBSITE.replace(/\/$/, '') + '/'})
  }

  processConfig = extend(true, conf, processConfig)

  if (
    typeof processConfig.ABE_WEBSITE !== 'undefined' &&
    processConfig.ABE_WEBSITE !== null
  ) {
    abeExtend.hooks.instance.trigger('afterHandlebarsHelpers', Handlebars)

    await Manager.instance.init()
  } else {
    error(
      'ABE_WEBSITE is not defined use node process.js ABE_WEBSITE=/path/to/website'
    )
    process.exit(0)
  }
}
