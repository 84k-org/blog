var hooks = {
  /***************** express *****************/
  beforeExpress: (port, abe) => {
     return port
  },
  afterExpress: (app, express, abe) => {
     return app
  },
  beforeRoute: (req, res, next, abe) => {
     return req
  },
  beforeAddRoute: (router, abe) => {
     return router
  },
  afterAddRoute: (router, abe) => {
     return router
  },

  /***************** create *****************/
  beforeDeleteFile: (filePath, abe) => {
    return filePath
  },
  afterDeleteFile: (path, json, abe) => {
    return path
  },

  /***************** create *****************/
  beforeCreate: (filePath, template, path, name, req, forceJson, abe) => {
    return filePath
  },
  afterCreate: (json, text, path, name, req, forceJson, abe) => {
    return json
  },

  /***************** duplicate *****************/
  beforeDuplicate: (oldFilePath, template, path, name, req, deleteFiles, abe) => {
    // if deleteFiles this is an update not a duplicate
    return oldFilePath
  },
  afterDuplicate: (json, oldFilePath, template, path, name, req, deleteFiles, abe) => {
    return json
  },

  /***************** update *****************/
  beforeUpdate: (json, oldFilePath, template, path, name, req, deleteFiles, abe) => {
    return json
  },

  /***************** save *****************/
  beforeFirstSave: (filePath, req, json, text, abe) => {
    return {
      filePath: filePath,
      json: json,
      text: text
    }
  },
  beforeSave: (obj, abe) => {
     return obj
  },
  afterSave: (obj, abe) => {
     return obj
  },
  beforeReject: (url, abe) => {
    return url
  },
  afterReject: (url, abe) => {
    return url
  },
  beforeSaveImage: (folderWebPath, req, abe) => {
    return folderWebPath
  },
  afterSaveImage: (resp, abe) => {
    return resp
  },
  afterPageSaveCompile: (tmp, json, abe) => {
    return tmp
  },

  /***************** Manager *****************/
  beforeGetAllFilesDraft: (drafted, abe) => {
    return drafted
  },
  beforeGetAllFilesPublished: (published, abe) => {
    return published
  },
  afterGetAllFiles: (merged, abe) => {
    return merged
  },

  /***************** Editor *****************/
  beforeImport: (file, config, ctx, abe) => {
     return file
  },
  afterImport: (res, file, config, ctx, abe) => {
     return res
  },
  afterHandlebarsHelpers: (Handlebars, abe) => {
     return Handlebars
  },
  beforeEditorInput: (params, abe) => {
     return params
  },
  afterEditorInput: (htmlString, params, abe) => {
     return htmlString
  },

  beforeAbeAttributes: (str, json, abe) => {
     return str
  },
  afterAbeAttributes: (obj, str, json, abe) => {
     return obj
  },
  beforeEditorFormBlocks: (json, abe) => {
     return json
  },
  afterEditorFormBlocks: (blocks, json, abe) => {
     return blocks
  },
  beforeListPage: (file, index, text) => {
     return file
  },
  afterListPageDraft: (workflow, file, index, text) => {
     return workflow
  },
  afterListPage: (res, file, index, text) => {
     return res
  },
  afterVariables: (EditorVariables, abe) => {
    return EditorVariables
  },

  /***************** json *****************/
  beforeGetJson: (path, abe) => {
     return path
  },
  afterGetJson: (json, abe) => {
     return json
  },

  /***************** text *****************/
  beforeGetTemplate: (file, abe) => {
     return file
  },
  afterGetTemplate: (text, abe) => {
     return text
  },

  /***************** Pagingate *****************/
  beforePaginateHtml: (html, index, abe) => {
     return html
  },

  /***************** Page *****************/
  beforePageText: (text, json, Handlebars, abe) => {
     return text
  },
  afterPageText: (text, json, Handlebars, abe) => {
     return text
  },

  beforePageJson: (json, abe) => {
     return json
  },
  afterPageJson: (json, abe) => {
     return json
  }
}

export default hooks
