import fse from 'fs-extra'
import extend from 'extend'
import {Promise} from 'es6-promise'

import {
  getAttr
  ,getEnclosingTags
  ,Util
  ,config
  ,fileUtils
  ,abeEngine
  ,fileAttr
  ,cli
  ,log
  ,getTemplate
  ,FileParser
  ,Hooks
  ,Plugins
} from '../../cli'

var util = new Util()
var arrayBlock = []
var text
var json
var fakeContent = false
var tabIndex = 0

function add(obj) {
  var value = obj.value
  
  if(obj.key.indexOf('[') > -1) {
    var key = obj.key.split('[')[0]
    var index = obj.key.match(/[^\[]+?(?=\])/)[0]
    var prop = obj.key.replace(/[^\.]+?\./, '')

    if(typeof json[key] !== 'undefined' && json[key] !== null &&
       typeof json[key][index] !== 'undefined' && json[key][index] !== null &&
       typeof json[key][index][prop] !== 'undefined' && json[key][index][prop] !== null) {
      obj.value = json[key][index][prop]
    }else if(typeof value !== 'undefined' && value !== null && value !== '') {
      if(typeof json[key] === 'undefined' || json[key] === null) json[key] = []
      if(typeof json[key][index] === 'undefined' || json[key][index] === null) json[key][index] = {}
      json[key][index][prop] = value
    }
  }else {
    if((typeof value === 'undefined' || value === null || value === '') && fakeContent) {
      if(typeof obj.source === 'undefined' || obj.source === null) {
        value = util.lorem(obj.type)
      }else {
        if (typeof obj.source === 'object') {
          value = []
          var i = 0
          Array.prototype.forEach.call(obj.source, (item) => {
            if(typeof obj.maxLength === 'undefined' || obj.maxLength === null || obj.maxLength === '' || i < obj.maxLength) {
              value.push(item)
            }
            i++
          })
          json[obj.key] = value
        }else {
          value = obj.source
        }
      }
      json[obj.key] = value
    }
  }

  if(fakeContent) {
    value = util.lorem(obj.type)
  }

  util.add(obj)

  return value
}

function addToForm(match, keyArray = null, i = 0) {
  var v = `{{${match}}}`,
      obj = Util.getAllAttributes(v, json)

  if(typeof keyArray !== 'undefined' && keyArray !== null) {
    var realKey = obj.key.replace(/[^\.]+?\./, '')

    if(obj.key.indexOf(keyArray + '.') >= 0 && realKey.length > 0){
      obj.keyArray = keyArray
      obj.realKey = realKey
      obj.key = keyArray + "[" + i + "]." + realKey
      obj.desc = obj.desc + " " + i,
      insertAbeEach(obj)

    }else if(util.dontHaveKey(obj.key)) {
      obj.value = json[obj.key]
      json[obj.key] = add(obj)
    }

  }else if(util.dontHaveKey(obj.key) && util.isSingleAbe(v, text)) {
    var realKey = obj.key.replace(/\./g, '-')
    obj.value = json[realKey]
    json[obj.key] = add(obj)
  }
}

function matchAttrAbe() {
  var patt = /abe [^{{}}]+?(?=\}})/g,
      match
  // While regexp match HandlebarsJS template item => keepgoing
  while (match = patt.exec(text)) {
    addToForm(match[0])
  }
}

function insertAbeEach (obj) {
  if(typeof arrayBlock[obj.keyArray][obj.realKey] === "undefined" || arrayBlock[obj.keyArray][obj.realKey] === null) {
    arrayBlock[obj.keyArray][obj.realKey] = []
  }
  var exist = false
  Array.prototype.forEach.call(arrayBlock[obj.keyArray][obj.realKey], (block) => {
    if(block.key === obj.key) {
      exist = true
    }
  })
  if(!exist) {
    arrayBlock[obj.keyArray][obj.realKey].push(obj)
  }
}

function each() {
  let pattEach = /(\{\{#each (\r|\t|\n|.)*?\/each\}\})/g
  let patt = /abe [^{{}}]+?(?=\}})/g
  var textEach, match

  while (textEach = pattEach.exec(text)) {
    var keyArray = textEach[0].match(/#each (\n|.)*?\}/)
    keyArray = keyArray[0].slice(6, keyArray[0].length - 1)

    if(keyArray.split(' ').length > 1) keyArray = keyArray.split(' ')[0]
    arrayBlock[keyArray] = []
    // ce while boucle sur les block de contenu {{abe}}
    while (match = patt.exec(textEach[0])) {
      var v = match[0]

      if(v.indexOf('abe') > -1){
        if(json[keyArray]){
          for (var i = 0; i < json[keyArray].length; i++) {
            var key = json[keyArray]
            addToForm(v, keyArray, i)
          }
        }else{
          addToForm(v, keyArray, 0)
        }
      }
    }

    // ici on boucle a nouveau sur les champs pour les placer a la suite dans le formulaire
    var attrArray = [],
        length = 0
    for(var index in arrayBlock[keyArray]) {
      attrArray.push(index)
      length = arrayBlock[keyArray][index].length
    }

    for (var i = 0; i < length; i++) {
      for (var j = 0; j < attrArray.length; j++) {
        add(arrayBlock[keyArray][attrArray[j]][i])
      }
    }
  }
}

function addSource() {
  var listReg = /({{abe.*type=[\'|\"]data.*}})/g,
      match,
      limit = 0

  while (match = listReg.exec(text)) {
    var obj = Util.getAllAttributes(match[0], json)

    if(obj.paginate) {
      obj.value = obj.value.slice(0, parseInt(obj.paginate))
      add(obj)
    }else if(obj.editable) {
      add(obj)
    }else {
      json[obj.key] = obj.source
    }
  }
}

function orderByTabindex(a, b) {
  if(a.order < b.order) {
    return -1
  }else if(a.order > b.order) {
    return 1
  }

  return 0
}

function orderBlock() {
    
  var formBlock = {}

  for(var tab in util.form) {
    var formBlockTab = {}
    for (var i = 0; i < util.form[tab].item.length; i++) {
      var blockName = (util.form[tab].item[i].block === '') ? 'default_' + i : util.form[tab].item[i].block
      if(util.form[tab].item[i].key.indexOf('[') > -1){
        blockName = util.form[tab].item[i].key.split('[')[0]
      }
      if(typeof formBlockTab[blockName] === 'undefined' || formBlockTab[blockName] === null) {
        formBlockTab[blockName] = []
      }
      formBlockTab[blockName].push(util.form[tab].item[i])
    }
    if(typeof blockName !== 'undefined' && blockName !== null) {
      formBlockTab[blockName].sort(orderByTabindex)
    }
    if(typeof formBlock[tab] === 'undefined' || formBlock[tab] === null) {
      formBlock[tab] = {}
    }

    var formBlockOrdered = {}
    var arKeys = Object.keys(formBlockTab).sort((a,b) => {
      if(formBlockTab[a][0].order < formBlockTab[b][0].order) {
        return -1
      }else if(formBlockTab[a][0].order > formBlockTab[b][0].order) {
        return 1
      }
      return 0
    })

    Array.prototype.forEach.call(arKeys, (arKey) => {
      formBlockOrdered[arKey] = formBlockTab[arKey]
    })
    formBlock[tab] = formBlockOrdered
  }

  var formTabsOrdered = {}
  var arKeysTabs = Object.keys(formBlock).sort((a,b) => {
    if(formBlock[a][Object.keys(formBlock[a])[0]][0].order < formBlock[b][Object.keys(formBlock[b])[0]][0].order) {
      return -1
    }else if(formBlock[a][Object.keys(formBlock[a])[0]][0].order > formBlock[b][Object.keys(formBlock[b])[0]][0].order) {
      return 1
    }
    return 0
  })

  Array.prototype.forEach.call(arKeysTabs, (arKeysTab) => {
    formTabsOrdered[arKeysTab] = formBlock[arKeysTab]
  })

  return formTabsOrdered
}

export function editor(fileName, tplUrl, fake) {
  var p = new Promise((resolve, reject) => {
    tabIndex = 0
    fakeContent = fake
    util = new Util()

    json = {}
    if(fileUtils.isFile(tplUrl.json.path)) {
      json = FileParser.getJson(tplUrl.json.path, 'utf8')
    }
    
    text = getTemplate(fileName)

    Util.getDataList(fileUtils.removeLast(tplUrl.publish.link), text, json, true)
      .then(() => {
        addSource()

        text = Util.removeDataList(text)

        matchAttrAbe(text, json)
        arrayBlock = []
        each(text, json)

        if(typeof json.abe_meta !== 'undefined' && json.abe_meta !== null) {
          var tpl = json.abe_meta.template.split('/')
          tpl = tpl.pop()
          json.abe_meta.cleanTemplate = fileUtils.removeExtension(tpl)
        }

        if(typeof json.abe_meta !== 'undefined' && json.abe_meta !== null) {
          var links = json.abe_meta.link.split('/')
          var link = links.pop()
          json.abe_meta.cleanName = fileUtils.removeExtension(link)
          json.abe_meta.cleanFilename = fileUtils.removeExtension(links.join('/'))
        }

        // HOOKS beforeEditorFormBlocks
        json = Hooks.instance.trigger('beforeEditorFormBlocks', json)

        var blocks = orderBlock()

        // HOOKS afterEditorFormBlocks
        blocks = Hooks.instance.trigger('afterEditorFormBlocks', blocks, json)

        abeEngine.instance.content = json

        resolve({
          text: text,
          form: blocks,
          json: json
        })
      }).catch(function(e) {
        console.error(e)
      })
  })

  return p
}