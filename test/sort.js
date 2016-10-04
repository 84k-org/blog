var chai = require('chai');
var fse = require('fs-extra');
var config = require('../src/cli').config
config.set({root: __dirname + '/fixtures'})

var Manager = require('../src/cli').Manager;
var coreUtils = require('../src/cli').coreUtils

describe('Sort', function() {
  before( function(done) {
    Manager.instance.init()
      .then(function () {
        done()
        
      }.bind(this))
  });

  /**
   * coreUtils.sort.byDateAsc
   * 
   */
  it('coreUtils.sort.byDateAsc', function() {
  	var list = Manager.instance.getList()
  	list.sort(coreUtils.sort.byDateAsc)
  	chai.expect(list[0].name).to.contain('homepage');
  	console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
  	console.log('list[0].name', list[0].name)
  	console.log('list[1].name', list[1].name)
  });

  /**
   * coreUtils.sort.byDateDesc
   * 
   */
  it('coreUtils.sort.byDateDesc', function() {
  	var list = Manager.instance.getList()
  	list.sort(coreUtils.sort.byDateDesc)
  	console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
  	console.log('list[0].name', list[0].name)
  	console.log('list[1].name', list[1].name)
  	chai.expect(list[0].name).to.contain('article');
  });

  /**
   * coreUtils.sort.shuffle
   * 
   */
  it('coreUtils.sort.shuffle', function() {
  	var list = Manager.instance.getList()
  	var shuffled = coreUtils.sort.shuffle(list)
  	chai.expect(shuffled[0].name).to.be.oneOf(['article-1.json', 'homepage-1.json']);
  });
});
