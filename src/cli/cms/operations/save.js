import fse from 'fs-extra'
import extend from 'extend'
import mkdirp from 'mkdirp'
import xss from 'xss'
import {Promise} from 'bluebird'
import path from 'path'

import {
  cmsOperations,
  cmsData,
  config,
  Page,
  cmsTemplates,
  abeExtend,
  coreUtils
} from '../../'

export function checkRequired(text, json) {
  var regAbe = /{{abe[\S\s].*?key=['|"]([\S\s].*?['|"| ]}})/g
  var matches = text.match(regAbe)
  var requiredValue = 0
  var complete = 0
  if(typeof matches !== 'undefined' && matches !== null){
    Array.prototype.forEach.call(matches, (match) => {
      if(typeof match !== 'undefined' && match !== null) {
        
        var keyAttr = cmsData.regex.getAttr(match, 'key')
        var requiredAttr = cmsData.regex.getAttr(match, 'required')
        if(requiredAttr === 'true') {
          requiredValue++

          var minAttr = cmsData.regex.getAttr(match, 'min-length')
          minAttr = (minAttr !== '') ? minAttr : 0

          if(typeof json[keyAttr] !== 'undefined' && json[keyAttr] !== null && json[keyAttr] !== '') {
            if(minAttr > 0) {
              if(json[keyAttr].length >= minAttr) {
                complete++
              }
            }else {
              complete++
            }
          }
        }
      }
    })
  }

  return Math.round((requiredValue > 0) ? complete * 100 / requiredValue : 100)
}

export function save(url, template, json, text = '', type = '') {
  // var p = new Promise((resolve) => {
    // var tplUrl = cmsData.file.fromUrl(url)
    // var pathIso = dateIso(tplUrl.json.path, type)

    // if (tplPath == null) {
    //   tplPath = json.abe_meta.template
    // }else if (tplPath.indexOf('.') > -1) {
    //   tplPath = tplPath.replace(/\..+$/, '')
    // }
    // var tpl = tplPath.replace(config.root, '')
    // var fullTpl = path.join(config.root, config.templates.url, tpl) + '.' + config.files.templates.extension

    // var ext = {
    //   template: tpl.replace(/^\/+/, ''),
    //   link: tplUrl.publish.link,
    //   complete: 0,
    //   type: type
    // }
    // let meta = config.meta.name
    // json[meta] = extend(json[meta], ext)
    // var date = cmsData.fileAttr.get(pathIso).d

    // if(typeof date === 'undefined' || date === null || date === '') {
    //   date = new Date()
    // }else {
    //   date = new Date(date)
    // }

    // cmsData.metas.add(tpl, json, type, {}, date)

    // if(typeof text === 'undefined' || text === null || text === '') {
    //   text = cmsTemplates.template.getTemplate(fullTpl)
    // }

    // cmsData.source.getDataList(path.dirname(tplUrl.publish.link), text, json)
    //     .then(() => {
          // json = abeExtend.hooks.instance.trigger('afterGetDataListOnSave', json)
          // for(var prop in json){
          //   if(typeof json[prop] === 'object' && Array.isArray(json[prop]) && json[prop].length === 1){
          //     var valuesAreEmpty = true
          //     json[prop].forEach(function (element) {
          //       for(var p in element) {
          //         if(element[p] !== ''){
          //           valuesAreEmpty = false
          //         }
          //       }
          //     })
          //     if(valuesAreEmpty){
          //       delete json[prop]
          //     }
          //   }
          // }


  var p = new Promise((resolve, reject) => {
    var obj = {
      type:type,
      template:{
        path: fullTpl
      },
      html: {
        path:path.join(config.root, config.publish.url, json.abe_meta.link)
      },
      json: {
        content: json,
        path: pathIso
      }
    }

    obj = abeExtend.hooks.instance.trigger('beforeSave', obj)

    // obj.json.content[meta].complete = checkRequired(text, obj.json.content)

    var res = saveJsonAndHtml(tpl.replace(/^\/+/, ''), obj, text)

    abeExtend.hooks.instance.trigger('afterSave', obj)

    resolve(res)
  })

  return p
}

export function saveJsonAndHtml(templateId, obj, html) {
  var page = new Page(templateId, html, obj.json.content, true)

  if (obj.json.content.abe_meta.status === 'publish') {
    saveHtml(obj.html.path, page.html)
  }
  saveJson(obj.json.path, obj.json.content)

  return {
    json: obj.json.content,
    jsonPath: obj.json.path,
    html: page.html,
    htmlPath: obj.html.path
  }
}

export function saveJson(url, json) {
  mkdirp.sync(path.dirname(url))

  if(typeof json.abe_source !== 'undefined' && json.abe_source !== null) {
    delete json.abe_source
  }

  var eachRecursive = function (obj) {
    for (var k in obj) {
      if (typeof obj[k] === 'object' && obj[k] !== null){
        eachRecursive(obj[k])
      } else if (typeof obj[k] !== 'undefined' && obj[k] !== null){
        obj[k] = xss(obj[k].toString().replace(/&quot;/g, '"'), { 'whiteList': config.htmlWhiteList })
      }
    }
  }

  eachRecursive(json)

  fse.writeJsonSync(url, json, {
    space: 2,
    encoding: 'utf-8'
  })
  return true
}

export function saveHtml(url, html) {
  mkdirp.sync(path.dirname(url))
  fse.writeFileSync(url, html)

  return true
}

export function dateIso(revisionPath, type = null) {
  var newDateISO
  var dateISO
  var saveJsonFile = revisionPath

  if (type === 'publish') {
    return revisionPath
  }

  dateISO = type[0] + cmsData.revision.removeStatusAndDateFromFileName((new Date().toISOString()))
  
  if(dateISO) {
    saveJsonFile = cmsData.fileAttr.add(saveJsonFile, dateISO)
  }

  return saveJsonFile
}