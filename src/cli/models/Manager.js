import Handlebars from 'handlebars'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'
import {
  config,
  FileParser,
  fileUtils,
  folderUtils,
  TimeMesure,
  getSelectTemplateKeys
} from '../../cli'

let singleton = Symbol()
let singletonEnforcer = Symbol()

class Manager {

  constructor(enforcer) {

    if(enforcer != singletonEnforcer) throw "Cannot construct Json singleton"
    
    Handlebars.templates = Handlebars.templates || {};
    this.loadHbsTemplates();
    this._init()
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new Manager(singletonEnforcer)
    }
    return this[singleton]
  }

  getList() {

    return this._list
  }

  setList(list) {

    this._list = list
  }

  _init() {
    const pathTemplate = path.join(config.root, config.templates.url);
    getSelectTemplateKeys(pathTemplate)
      .then((whereKeys) => {
        this._whereKeys = whereKeys
        this.updateList()
      })
      .catch((e) => {
        console.log('Manager._init', e)
      })
  }

  updateList() {
    this._list = FileParser.getAllFilesWithMeta(this._whereKeys)
    // console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
    // console.log('this._list[0]', this._list[0])

    // this._list = FileParser.getAllFiles(useKeys)
    this._list.sort(FileParser.predicatBy('date'))

    return this
  }

  addHbsTemplate(templateId) {
    const pathTemplate = path.join(config.root, config.templates.url, 'hbs', templateId) + '.hbs';
    var tmpl = eval("(function(){return " + fse.readFileSync(pathTemplate) + "}());");
    Handlebars.templates[templateId] = Handlebars.template(tmpl);
  }

  loadHbsTemplates() {
    const pathTemplate = path.join(config.root, config.templates.url, 'hbs');

    if(!folderUtils.isFolder(pathTemplate)) {
      mkdirp.sync(pathTemplate)
    }

    fse.readdirSync(pathTemplate).forEach(function (file) {
      if (file.indexOf(".hbs") > -1) {
        let originalTemplatePath = path.join(config.root, config.templates.url) + '/' + file.replace('.hbs', '.' + config.files.templates.extension)
        
        try{
          let originalTemplateStat = fse.statSync(originalTemplatePath);
          let originalTemplateMdate = originalTemplateStat.mtime;
          let stat = fse.statSync(path.join(pathTemplate, file));
          let mdate = stat.mtime;

          // if the original template has been updated after precompilation, I delete the precompiled file
          // else I add it to the hbs template array
          if(originalTemplateMdate>mdate){
            fse.unlinkSync(path.join(pathTemplate, file));
          } else {
            var tmpl = eval("(function(){return " + fse.readFileSync(path.join(pathTemplate, file)) + "}());");
            Handlebars.templates[file.replace('.hbs', '')] = Handlebars.template(tmpl);
          }
        }
        catch(err) {
            console.log('The original template has not been found or the hbs template is corrupted');
            console.log(originalTemplatePath)
            console.log(err)
        } 
      }
    })
  }
}

export default Manager