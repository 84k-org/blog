/*global document, json, window, CONFIG, alert, location */

import Nanoajax from 'nanoajax'
import qs from 'qs'
import {Promise} from 'es6-promise'
import on from 'on'
let singleton = Symbol()
let singletonEnforcer = Symbol()

export default class Json {

  constructor(enforcer) {
    this._headers = {}
    this._data = json
    this._ajax = Nanoajax.ajax
    this.canSave = true

    this.saving = on(this)
    this.headersSaving = on(this)

    if(enforcer != singletonEnforcer) throw 'Cannot construct Json singleton'
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new Json(singletonEnforcer)
      window.formJson = this[singleton]
    }
    return this[singleton]
  }

  save(type = 'draft', tplPath = null, filePath = null) {
    this.saving._fire({type: type})
    var p = new Promise((resolve) => {
      if(!this.canSave){
        resolve({})
        this.canSave = true
        return
      }
      var jsonSave = this.data

      if(typeof json.abe_source !== 'undefined' && json.abe_source !== null) {
        delete json.abe_source
      }

      var toSave = qs.stringify({
        tplPath: (tplPath) ? tplPath : CONFIG.TPLPATH,
        filePath: (filePath) ? filePath : CONFIG.FILEPATH,
        json: jsonSave
      })

      this.headersSaving._fire({url: document.location.origin + '/' + type})

      this._ajax(
        {
          url: document.location.origin + '/abe/' + type,
          body: toSave,
          headers: this._headers,
          method: 'post'
        },
        (code, responseText) => {
          try{
            var jsonRes = JSON.parse(responseText)
            if(typeof jsonRes.error !== 'undefined' && jsonRes.error !== null) {
              alert(jsonRes.error)
              return
            }
            // if(typeof jsonRes.reject !== 'undefined' && jsonRes.reject !== null) {
            //   location.reload()
            //   return
            // }
            this.data = jsonRes.json
          }
          catch(e){
            alert('The following error happened : \n' + e + '\n if it persist, reload your web page tab.')
            jsonRes = {}
          }
          resolve(jsonRes)
        })
    })

    return p
  }

  set data(obj) {
    this._data = obj
  }

  get data() {
    return this._data
  }
}