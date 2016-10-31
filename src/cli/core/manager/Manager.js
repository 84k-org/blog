import Handlebars from 'handlebars'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import events from 'events'
import path from 'path'
import watch from 'watch'
import {
  coreUtils,
  cmsData,
  config,
  cmsTemplates
} from '../../'

let singleton = Symbol()
let singletonEnforcer = Symbol()

class Manager {

  constructor(enforcer) {

    if(enforcer != singletonEnforcer) throw 'Cannot construct Json singleton'
    
    Handlebars.templates = Handlebars.templates || {}
    this.loadHbsTemplates()
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new Manager(singletonEnforcer)
    }
    return this[singleton]
  }

  init() {
    this._pathTemplate = path.join(config.root, config.templates.url)
    this._pathStructure = path.join(config.root, config.structure.url)
    this._pathData = path.join(config.root, config.data.url)
    this._watchersStart()

    this.updateStructureAndTemplates()
    var p = new Promise((resolve) => {
      this.getKeysFromSelect()
        .then(() => {
          resolve()
        },
        (e) => {
          console.log('Manager.init', e)
          resolve()
        })
        .catch((e) => {
          console.log('Manager.init', e)
        })
    })

    return p
  }

  _watchersStart() {
    this.events = {
      template: new events.EventEmitter(0),
      structure: new events.EventEmitter(0)
    }

    try {
      fse.accessSync(this._pathTemplate, fse.F_OK)
      this._watchTemplateFolder = watch.createMonitor(this._pathTemplate, (monitor) => {
        monitor.on('created', (f, stat) => {
          this.getKeysFromSelect()
          this.updateStructureAndTemplates()
          this.events.template.emit('update')
        })
        monitor.on('changed', (f, curr, prev) => {
          this.getKeysFromSelect()
          this.updateStructureAndTemplates()
          this.events.template.emit('update')
          
        })
        monitor.on('removed', (f, stat) => {
          this.getKeysFromSelect()
          this.updateStructureAndTemplates()
          this.events.template.emit('update')
        })
      })
    } catch (e) {
      console.log('the directory ' + this._pathTemplate + ' does not exist')
    }

    try {
      fse.accessSync(this._pathStructure, fse.F_OK)
      this._watchStructure = watch.createMonitor(this._pathStructure, (monitor) => {
        monitor.on('created', (f, stat) => {
          this.updateStructureAndTemplates()
          this.events.structure.emit('update')
        })
        monitor.on('changed', (f, curr, prev) => {
          this.updateStructureAndTemplates()
          this.events.structure.emit('update')
        })
        monitor.on('removed', (f, stat) => {
          this.updateStructureAndTemplates()
          this.events.structure.emit('update')
        })
      })
    } catch (e) {
      console.log('the directory ' + this._pathStructure + ' does not exist')
    }
    
  }

  getKeysFromSelect() {
    this._whereKeys = []
    var p = new Promise((resolve) => {
      cmsTemplates.template.getSelectTemplateKeys(this._pathTemplate)
        .then((whereKeys) => {
          this._whereKeys = whereKeys
          this.updateList()
          resolve()
        },
        (e) => {
          console.log('Manager.getKeysFromSelect', e)
        })
        .catch((e) => {
          console.log('Manager.getKeysFromSelect', e)
        })
    })

    return p
  }

  getStructureAndTemplates() {

    return this._structureAndTemplates
  }

  updateStructureAndTemplates() {
    this._structureAndTemplates = cmsTemplates.template.getStructureAndTemplates()
  }

  getList() {

    return this._list
  }

  getListWithStatusOnFolder(status, folder = '') {
    var list = []
    folder = path.join(config.root, config.data.url, folder)
    Array.prototype.forEach.call(this._list, (file) => {
      if (typeof file[status] !== 'undefined' && file[status] !== null && file.path.indexOf(folder) > -1) {
        list.push(file)
      }
    })

    return list
  }

  setList(list) {
    this._list = list

    return this
  }

  addPostInList(pathFile){
    const parentRelativePath = cmsData.fileAttr.delete(pathFile).replace(config.root, '').replace(/^\/?.+?\//, '')
    const json = cmsData.file.get(pathFile)
    let merged = {}
    let rev = []
    let revision = cmsData.file.getFileObject(pathFile)

    revision = cmsData.file.getAbeMeta(revision, json)
    Array.prototype.forEach.call(this._whereKeys, (key) => {
      var keyFirst = key.split('.')[0]
      revision[keyFirst] = json[keyFirst]
    })
    rev.push(revision)
    merged = cmsData.revision.mergeRevisions(rev)
    const sortedResult = cmsData.revision.sortRevisions(merged)
    this._list.push(sortedResult[0])
    this._list.sort(coreUtils.sort.predicatBy('date', -1))
  }

  updatePostInList(pathFile){
    const parentRelativePath = cmsData.fileAttr.delete(pathFile).replace(config.root, '').replace(/^\/?.+?\//, '')
    const found = coreUtils.array.find(this._list, 'parentRelativePath', parentRelativePath)
    if(found.length > 0){
      const index = found[0]
      const json = cmsData.file.get(pathFile)
      let merged = {}
      merged[parentRelativePath] = this._list[index]
      let revision = cmsData.file.getFileObject(pathFile)
      revision = cmsData.file.getAbeMeta(revision, json)
      Array.prototype.forEach.call(this._whereKeys, (key) => {
        var keyFirst = key.split('.')[0]
        revision[keyFirst] = json[keyFirst]
      })
      merged[parentRelativePath].revisions.push(JSON.parse(JSON.stringify(revision)))
      const sortedResult = cmsData.revision.sortRevisions(merged)          
      this._list[index] = sortedResult[0]
      this._list.sort(coreUtils.sort.predicatBy('date', -1))
    }
  }

  removePostInList(pathFile){
    const parentRelativePath = cmsData.fileAttr.delete(pathFile).replace(config.root, '').replace(/^\/?.+?\//, '')
    const found = coreUtils.array.find(this._list, 'parentRelativePath', parentRelativePath)
    if(found.length > 0){
      console.log('ok found')
    }
  }

  updateList() {
    this._list = cmsData.file.getAllWithKeys(this._whereKeys)
    this._list.sort(coreUtils.sort.predicatBy('date', -1))
    console.log('Manager updated')
    
    return this
  }

  addHbsTemplate(templateId) {
    const pathTemplate = path.join(config.root, config.templates.url, 'hbs', templateId) + '.hbs'
    var tmpl = eval('(function(){return ' + fse.readFileSync(pathTemplate) + '}());')
    Handlebars.templates[templateId] = Handlebars.template(tmpl)
  }

  loadHbsTemplates() {
    const pathTemplate = path.join(config.root, config.templates.url, 'hbs')

    try {
      var directory = fse.lstatSync(pathTemplate)
      if (!directory.isDirectory()) {
        mkdirp.sync(pathTemplate)
      }
    } catch (e) {
      mkdirp.sync(pathTemplate)
    }

    fse.readdirSync(pathTemplate).forEach(function (file) {
      if (file.indexOf('.hbs') > -1) {
        let originalTemplatePath = path.join(config.root, config.templates.url) + '/' + file.replace('.hbs', '.' + config.files.templates.extension)
        
        try{
          let originalTemplateStat = fse.statSync(originalTemplatePath)
          let originalTemplateMdate = originalTemplateStat.mtime
          let stat = fse.statSync(path.join(pathTemplate, file))
          let mdate = stat.mtime

          // if the original template has been updated after precompilation, I delete the precompiled file
          // else I add it to the hbs template array
          if(originalTemplateMdate>mdate){
            fse.unlinkSync(path.join(pathTemplate, file))
          } else {
            var tmpl = eval('(function(){return ' + fse.readFileSync(path.join(pathTemplate, file)) + '}());')
            Handlebars.templates[file.replace('.hbs', '')] = Handlebars.template(tmpl)
          }
        }
        catch(err) {
          console.log('The original template has not been found or the hbs template is corrupted')
          console.log(originalTemplatePath)
          console.log(err)
        } 
      }
    })
  }
}

export default Manager