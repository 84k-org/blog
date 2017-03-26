import fs from 'fs-extra'
import path from 'path'

import {
	Manager,
  coreUtils,
  config,
  Handlebars
} from '../../cli'

/**
 * This route returns the structure as HTML
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var route = function(req, res){
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
  var structure = Manager.instance.getStructureAndTemplates().structure
  structure = JSON.stringify(structure).replace(new RegExp(config.root, 'g'), '')

  var EditorVariables = {
    user: res.user,
    slugs: Manager.instance.getSlugs(),
    abeUrl: '/abe/editor/',
    Locales: coreUtils.locales.instance.i18n,
    manager: manager,
    config: JSON.stringify(config),
    structure: structure
  }
  res.render('../views/list-structure.html', EditorVariables)
}

export default route
