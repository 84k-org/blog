/*global document, window, alert */

import Nanoajax from 'nanoajax'
import qs from 'qs'
import FolderSelect from './FolderSelect'
import TemplateSelect from './TemplateSelect'

export default class FormCreate {
  constructor() {
    this._form = document.querySelector('[data-form-abe-create="true"]')
    if(typeof this._form !== 'undefined' && this._form !== null) {

      // constantes variables
      this._filePath = ''
      this._ajax = Nanoajax.ajax

      // constantes variables DOM elements
      this._form = document.querySelector('.form-create')

      this._formInputs = [].slice.call(this._form.querySelectorAll('input, select'))

      this._submitBtn = this._form.querySelector('button[type=submit]')

      // // constantes methodes
      // this._handlePathChange = this._pathChange.bind(this)
      // this._handleCanCreate = this._canCreate.bind(this)
      // this._handleSubmit = this._submit.bind(this)

      // // manager update btn
      this._btnCreate = document.querySelector('[date-abe-create]')
      this._btnUpdate = document.querySelector('[date-abe-update]')
      this._btnDuplicate = document.querySelector('[date-abe-duplicate]')
      this._handleBtnDuplicateManagerClick = this._btnDuplicateManagerClick.bind(this)
      this._handleBtnUpdateManagerClick = this._btnUpdateManagerClick.bind(this)
      this._handleBtnCreateManagerClick = this._btnCreateManagerClick.bind(this)

      // // init modules
      new FolderSelect()
      // new TemplateSelect()

      this._bindEvents() 
    }
  }

  _bindEvents() {
    // this._inputs.forEach((input) => { input.addEventListener('keyup', this._handleCanCreate) })
    // this._inputs.forEach((input) => { input.addEventListener('blur', this._handleCanCreate) })
    // this._selects.forEach((select) => { select.addEventListener('change', this._handlePathChange) })

    if(typeof this._btnUpdate !== 'undefined' && this._btnUpdate !== null) {
      this._btnUpdate.addEventListener('click', this._handleBtnUpdateManagerClick) // click update metadata
    }
    if(typeof this._btnCreate !== 'undefined' && this._btnCreate !== null) {
      this._btnCreate.addEventListener('click', this._handleBtnCreateManagerClick) // click update metadata
    }
    if(typeof this._btnDuplicate !== 'undefined' && this._btnDuplicate !== null) {
      this._btnDuplicate.addEventListener('click', this._handleBtnDuplicateManagerClick) // click duplicate content
    }

    // if(typeof this._templateName !== 'undefined' && this._templateName !== null) {
    //   this._templateName.addEventListener('submit', this._handleCanCreate)
    // }
    if(typeof this._form !== 'undefined' && this._form !== null) {
      this._form.addEventListener('submit', this._handleSubmit)
    }
  }

  _submit(type, target) {
    var values = {}
    var postName = ""
    var postPath = ""
    var isValid = true
    Array.prototype.forEach.call(this._formInputs, (input) => {
      input.parentNode.classList.remove('error')
      var autocomplete = input.getAttribute('data-autocomplete') == "true" ? true : false
      // var precontrib = input.getAttribute('data-precontrib') == "true" ? true : false
      var slug = input.getAttribute('data-slug')
      var slugType = input.getAttribute('data-slug-type')
      var required = input.getAttribute('data-required') == "true" ? true : false
      var value = input.value

      if (slug != "false") {
        if (slug == "true") {
          slug = true
        }
      }else {
        slug = false
      }
      input.getAttribute('data-slug') !== "false"
        ? (input.getAttribute('data-slug') == "true")
          ? input.getAttribute('data-slug') : true
        : false

      if (autocomplete) {
        var results = input.parentNode.querySelectorAll('.autocomplete-result')
        var autocompleteValue = ""
        values[input.getAttribute('data-id')] = []
        Array.prototype.forEach.call(results, (result) => {
          var resultValue = result.getAttribute("value")
          // autocompleteValue = result.getAttribute("value")
          if (resultValue.indexOf('{') > -1) {
            try {
              var jsonValue = JSON.parse(resultValue)
              value += (autocompleteValue !== "") ? "-" + jsonValue[slug] : jsonValue[slug]
              values[input.getAttribute('data-id')].push(jsonValue)
            }catch(e) {
              value += (autocompleteValue !== "") ? "-" + autocompleteValue : autocompleteValue
              values[input.getAttribute('data-id')].push(value)
            }
          }
        })
      }else {
        if (value.indexOf('{') > -1) {
          try {
            var jsonValue = JSON.parse(value)
            value = jsonValue[slug]
          }catch(e) {
            value = value
          }
        }
        values[input.getAttribute('data-id')] = value
      }

      if (value !== "") {
        switch(slugType) {
          case "path":
            postPath += value + "/"
            break
          case "name":
            postName += (postName !== "") ? "-" + value : value
            break
          default:
            break
        }
      }else if(required) {
        input.parentNode.classList.add('has-error')
        isValid = false
      }
    })
    var filePath = postPath + postName
    var toSave = qs.stringify(values)

    if (isValid) {
      this._ajax(
        {
          url: document.location.origin + '/abe/' + type + '/' + filePath,
          body: toSave,
          headers: {},
          method: 'post'
        },
          (code, responseText) => {
            var jsonRes = JSON.parse(responseText)
            if (jsonRes.success == 1 && typeof jsonRes.json.abe_meta !== 'undefined' && jsonRes.json.abe_meta !== null) {
              window.location.href = window.location.origin + '/abe' + jsonRes.json.abe_meta.link
            }else {
              alert('error')
              btn.classList.remove('disable')
            }
          })
    }
  }

  _pathChange() {
    this._setFilePath()
    this._canCreate()
  }

  // _submit() {
  //   this._setFilePath()
  // }

  /**
   * check if select page create are not empty
   * @return {Boolean} true|false
   */
  _canCreate() {
    var isValid = true

    if(typeof this._templateName !== 'undefined' && this._templateName !== null && this._templateName.value === '') {
      isValid = false
    }

    if(typeof this._tplName !== 'undefined' && this._tplName !== null && this._tplName.value === '') {
      isValid = false
    }

    if(isValid) {
      this._submitBtn.removeAttribute('disabled')
    }else {
      this._submitBtn.setAttribute('disabled', 'disabled')
    }
  }

  _setFilePath() {
    this._filePath = this._getFilePath()
    this._form.querySelector('[name="filePath"]').value = this._filePath
  }

  _getFilePath() {
    var path = ''

    this._selects.forEach((select) => {
      if(select.offsetWidth > 0 && select.offsetHeight > 0) {
        var value = select.querySelector('option:checked').getAttribute('clean-value')
        if(typeof value !== 'undefined' && value !== null && value !== '') {
          path += value + '/'
        }else if(typeof select.value !== 'undefined' && select.value !== null && select.value !== '') {
          path += select.value + '/'
        }
      }
    })

    path = path.slice(0, -1)
    path = path.split('/')
    path = path.join('/')
    path = '/' + path.replace(/^\//, '')

    return path
  }

  // _submit(type, btn) {
  //   if(btn.classList.contains('disable')) return
  //   btn.classList.add('disable')
  //   var inputs = [].slice.call(document.querySelectorAll('.form-create input'))
  //   inputs = inputs.concat([].slice.call(document.querySelectorAll('.form-create select')))
  //   var values = {}
  //   Array.prototype.forEach.call(inputs, (input) => {
  //     values[input.getAttribute('name')] = input.value
  //   })
  //   var toSave = qs.stringify(values)

  //   this._ajax(
  //     {
  //       url: document.location.origin + '/abe/' + type + '/?' + toSave,
  //       body: toSave,
  //       headers: {},
  //       method: 'get'
  //     },
  //       (code, responseText) => {
  //         var jsonRes = JSON.parse(responseText)
  //         if (jsonRes.success == 1 && typeof jsonRes.json.abe_meta !== 'undefined' && jsonRes.json.abe_meta !== null) {
  //           window.location.href = window.location.origin + '/abe' + jsonRes.json.abe_meta.link
  //         }else {
  //           alert('error')
  //           btn.classList.remove('disable')
  //         }
  //       })
  // }

  _btnDuplicateManagerClick(e) {
    e.preventDefault()
    this._submit('duplicate', e.target)
  }

  _btnUpdateManagerClick(e) {
    e.preventDefault()
    this._submit('update', e.target)
  }

  _btnCreateManagerClick(e) {
    e.preventDefault()
    this._submit('create', e.target)
  }
}