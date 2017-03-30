import pkg from '../../../package'
import {
  config,
  Page,
  cmsData,
  cmsTemplates,
  coreUtils,
  abeExtend,
  Manager,
  User
} from '../../cli'

/**
 * This route returns the homepage HTML
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
var route = function(req, res, next) {
  var manager = {}
  manager.home = {files: []}
  manager.list = Manager.instance.getStructureAndTemplates()
  manager.config = JSON.stringify(config)

  var isHome = true
  var jsonPath = null
  var linkPath = null
  var template = null
  var fileName = null
  var folderPath = null
  var files = Manager.instance.getList()
  var publishedFiles = Manager.instance.getListWithStatusOnFolder('publish')
  var percent = (publishedFiles.length / files.length * 100).toFixed(1)
  var connectedUsers = Manager.instance.getConnections()
  var totalUsers = config.users
  var statistics = {
    totalUsers:totalUsers.length,
    connectedUsers:connectedUsers.length,
    totalPage: files.length,
    totalPublishedPage: publishedFiles.length,
    percentPublishedPages: percent,
    svgCirclePercent: 629 * (percent/100)
  }

  var EditorVariables = {
    user: res.user,
    slugs: Manager.instance.getSlugs(),
    filename: fileName,
    folderPath: folderPath,
    abeUrl: '/abe/editor/',
    isHome: isHome,
    config: config,
    Locales: coreUtils.locales.instance.i18n,
    abeVersion: pkg.version,
    manager: manager,
    statistics: statistics
  }

  res.render('../views/template-home', EditorVariables)
}

export default route