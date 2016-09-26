import fse from "fs-extra"
import clc from "cli-color"
import extend from "extend"
import path from "path"
import {
  Util,
  FileParser,
  config,
  fileUtils,
  folderUtils,
  cli,
  log
} from "../"

let singleton = Symbol()
let singletonEnforcer = Symbol()

class Plugins {

  constructor(enforcer) {
    if(enforcer != singletonEnforcer) throw "Cannot construct Plugins singleton"
    this._plugins = []
    this.fn = []
    var pluginsDir = path.join(config.root, config.plugins.url)
    if(folderUtils.isFolder(pluginsDir)) {
      this._plugins = FileParser.getFolders(pluginsDir, true, 0)
      Array.prototype.forEach.call(this._plugins, (plugin) => {
        // has hooks
        var plugHooks = path.join(plugin.path, config.hooks.url)
        if(folderUtils.isFolder(plugHooks)) {
          var plugHooksFile = path.join(plugHooks, "hooks.js")
          var h = require(plugHooksFile)
          plugin.hooks = h.default
        }else {
          plugin.hooks = null
        }

        // has partials
        var plugPartials = path.join(plugin.path, config.pluginsPartials)
        if(folderUtils.isFolder(plugPartials)) {
          plugin.partials = plugPartials
        }else {
          plugin.partials = null
        }

        // has templates
        var plugTemplates = path.join(plugin.path, config.templates.url)
        if(folderUtils.isFolder(plugTemplates)) {
          plugin.templates = plugTemplates
        }else {
          plugin.templates = null
        }

        // has routes
        var plugRoutes = path.join(plugin.path, "routes")
        if(folderUtils.isFolder(plugRoutes)) {
          plugin.routes = {}

          var gets = path.join(plugRoutes, "get")
          if(folderUtils.isFolder(gets)) {
            var routesGet = FileParser.getFiles(gets, true, 0)
            Array.prototype.forEach.call(routesGet, (route) => {
              route.routePath = `/abe/plugin/${plugin.name}/${route.name.replace(".js", "")}*`
            })
            plugin.routes.get = routesGet
          }

          var posts = path.join(plugRoutes, "post")
          if(folderUtils.isFolder(posts)) {
            var routesPost = FileParser.getFiles(posts, true, 0)
            Array.prototype.forEach.call(routesPost, (route) => {
              route.routePath = `/abe/plugin/${plugin.name}/${route.name.replace(".js", "")}*`
            })
            plugin.routes.post = routesPost
          }
        }else {
          plugin.routes = null
        }
      })
    }
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new Plugins(singletonEnforcer)
    }
    return this[singleton]
  }

  hooks() {
    if(arguments.length > 0) {
      var args = [].slice.call(arguments)
      var fn = args.shift()

      if(typeof this._plugins !== "undefined" && this._plugins !== null) {
        Array.prototype.forEach.call(this._plugins, (plugin) => {
          if(typeof plugin.hooks !== "undefined" && plugin.hooks !== null
            && typeof plugin.hooks[fn] !== "undefined" && plugin.hooks[fn] !== null) {
            args[0] = plugin.hooks[fn].apply(this, args)
          }
        })
      }
    }

    return args[0]
  }

  getHooks() {
    return this._plugins
  }

  getPartials() {
    var partials = []
    Array.prototype.forEach.call(this._plugins, (plugin) => {
      if(typeof plugin.partials !== "undefined" && plugin.partials !== null) {
        partials.push(plugin.partials)
      }
    })

    return partials
  }

  getRoutes() {
    var routes = []
    Array.prototype.forEach.call(this._plugins, (plugin) => {
      if(typeof plugin.routes !== "undefined" && plugin.routes !== null) {
        routes = routes.concat(plugin.routes)
      }
    })

    return routes
  }
}

export default Plugins