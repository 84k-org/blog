import fse from 'fs-extra'

import {
  FileParser,
  fileUtils,
  config
} from '../../cli'

var route = function(req, res, next){
  var file = fileUtils.concatPath(config.root, 'logs', `${req.params[0]}.log`)
  var html = ''
  if (fileUtils.isFile(file)) {
    fse.removeSync(file)
    res.redirect('/abe/delete-logs/');
  }else {
    var path = fileUtils.concatPath(config.root, 'logs')
    var files = FileParser.read(path, path, 'files', true, /\.log/, 99)

    html += '<a href="/abe/logs">Go to logs</a>'
    html += '<br /><br /><div>Choose to remove logs files</div>'
    html += '<ul>'
    Array.prototype.forEach.call(files, (item) => {
      html += '<li>'
      html += '<a href="/delete-logs/' + fileUtils.removeExtension(item.cleanPath) + '">' + item.name + '</a><br />'
      html += '</li>'
    })
    html += '</ul>'
    res.send(html)
  }
}

export default route