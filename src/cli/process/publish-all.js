// ./node_modules/.bin/babel-node src/cli/process/publish-all.js ABE_WEBSITE=/path/to/website
// ./node_modules/.bin/babel-node src/cli/process/publish-all.js FILEPATH=/path/to/website/path/to/file.html ABE_WEBSITE=/path/to/website
import {
  config
  ,FileParser
  ,fileUtils
  ,folderUtils
  ,save
  ,log
} from '../../cli'

var pConfig = {}
Array.prototype.forEach.call(process.argv, (item) => {
  if (item.indexOf('=') > -1) {
    var ar = item.split('=')
    pConfig[ar[0]] = ar[1]
  }
})

if(typeof pConfig.ABE_WEBSITE !== 'undefined' && pConfig.ABE_WEBSITE !== null) {
  if(pConfig.ABE_WEBSITE) config.set({root: pConfig.ABE_WEBSITE.replace(/\/$/, '') + '/'})

  log.write('publish-all', '* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
  log.write('publish-all', 'start process publish')
  var dateStart = new Date()

  var type = null
  var folder = null
  if(typeof pConfig.FILEPATH !== 'undefined' && pConfig.FILEPATH !== null) {
    pConfig.FILEPATH = fileUtils.concatPath(config.root, config.data.url, pConfig.FILEPATH.replace(config.root))

    var fileJson = FileParser.getJson(
      pConfig.FILEPATH.replace(new RegExp("\\." + config.files.templates.extension), '.json')
    )

    type = fileJson.abe_meta.template
    folder = fileUtils.removeLast(fileJson.abe_meta.link)
  }

  var site = folderUtils.folderInfos(config.root)
  var allPublished = []

  let publish = config.publish.url
  var published = FileParser.getFilesByType(fileUtils.concatPath(site.path, publish))
  published = FileParser.getMetas(published, 'draft')

  var ar_url = []
  var promises = []

  published.forEach(function (pub) {
    var json = FileParser.getJson(
        FileParser.changePathEnv(pub.path, config.data.url).replace(new RegExp("\\." + config.files.templates.extension), '.json'))
    ar_url.push(pub.path)

    // save(url, tplPath, json = null, text = '', type = '', previousSave = null, realType = 'draft', publishAll = false)

    log.write('publish-all', 'started by : ' + pub.path .replace(config.root, ''))
    var p = new Promise((resolve, reject) => {
      save(
        pub.path,
        json.abe_meta.template,
        json,
        '',
        'publish',
        null,
        'publish',
        true)
        .then(() => {
          resolve()
        }).catch(function(e) {
          next();
        })
    })
    promises.push(p)
  })

  log.write('publish-all', 'total ' + promises.length)

  Promise.all(promises)
    .then(() => {
      dateStart = (new Date().getTime() - dateStart.getTime()) / 1000
      log.write('publish-all', 'publish process finised in ' + dateStart + 'sec')
      process.exit(0)
    }).catch(function(e) {
      console.error(e.stack)
      next();
    })

}else {
  console.log('ABE_WEBSITE is not defined use node process.js ABE_WEBSITE=/pat/to/website')
  process.exit(0)
}