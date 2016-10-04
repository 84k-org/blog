import fse from 'fs-extra'
import path from 'path'
import {
  cli
  ,FileParser
  ,fileUtils
  ,dateUnslug
  ,config
  ,Manager
} from '../../'

var fullAttr = '-abe-(.+?)(?=\.'
var captureAttr = '-abe-(.+?)(?=\.'
var oneAttr = ['[\\|]?', '=(.)*?(?=[\||\\]])']

/**
 * Class Attr
 * Work string to manage string attributes key/value
 */
class Attr {

  /**
   * @param  {String} str string to work with
   * @return {void}
   */
  constructor(str) {
    this.str = str
    this.val = {}
    this.extract()
  }

  /**
   * @return {Object} attributs extracted from string as an object
   */
  extract() {
    var rex = new RegExp(captureAttr + this.getExtention() + ')')
    if(rex.test(this.str)) {
      var arrAttr = this.str.match(rex)[0].replace('-abe-', '')
      this.val = {'s': arrAttr[0], 'd': dateUnslug(arrAttr.slice(1), this.str)}
    }
    return this.val
  }

  /**
   * @return {String} str without an attributs
   */
  remove() {
    return this.str.replace(new RegExp(fullAttr + this.getExtention() + ')'), '')
  }
 
  getExtention(){
    var ext = this.str.split('.')
    return ext[ext.length - 1]
  }

  /**
   * Insert attributs to the string
   * @param  {String} string composed of a status (ex: v for validate, d for draft ...) and a date
   * @return {String} the new string with added attributs
   */
  insert(newValues) {
    var strWithoutAttr = this.remove()
    strWithoutAttr = strWithoutAttr.replace(new RegExp('\\.' + this.getExtention()), '')
    return strWithoutAttr + '-abe-' + newValues + '.' + this.getExtention()
  }

}

/**
 * Class FileAttr
 * Manage string with attributs encoded inside
 */
export default class FileAttr {

  /**
   * Add attributs or modify them if they already exists
   * @param {String} str the string to modify
   * @param {Object} options object with attributs to add
   * @return {String} the string with the new attributs
   */
  static add(str, options) {
    var attr = new Attr(str)
    return attr.insert(options)
  }

  /**
   * Remove attributs from string
   * @param {String} str the string to modify
   * @return {String} the string modified
   */
  static delete(str) {
    return new Attr(str).remove()
  }

  /**
   * @param  {String} str the string to get attributs from
   * @return {object|String} object (all the attributs) if the key is null, if not the value of the atrtibuts
   */
  static get(str) {
    return new Attr(str).val
  }

  /**
   * @param  {String} str the string to test attributs from
   * @return {boolean} true if string has attr
   */
  static test(str) {
    var att = new Attr(str).val
    return (typeof att.s !== 'undefined' && att.s !== null)
  }
}

