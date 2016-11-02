#!/usr/bin/env node
var program = require('commander');
var jsdom = require('jsdom');
var fs = require('fs');
var jquery = require("jquery");
var Promise = require('promise');
var plato = require('plato');
var TMP_FOLDER = '.tmp_plato/';
// Program options
program
.version('1.0.0')
.option('-o --output <output>', 'Directory of output will be stored')
.option('-r --root <root>','Root directory. Default current')
.arguments('<component>')
.action(function(component){
  program.component = component;
})
.parse(process.argv);

program.root = program.root || './';
console.log(program.component, program.output)
if (typeof  program.component === 'undefined' || typeof program.output === 'undefined'){
  program.help();
}

// Program
function getCurrentDir(file){
  var split = file.split('/');
  split.length = split.length -1;
  // remove reference to current folder
  if (split[0] === '.') split.splice(0,1);
  return program.root + split.join('/') + '/';
}
function removeDotDot(url){
  var realUrl = [];
  var splited = url.split('/');
  for (var i=0;i<splited.length;i++){
    if (splited[i] === '..' && realUrl.length > 0){
      realUrl.length = realUrl.length -1;
    } else {
      realUrl.push(splited[i]);
    }
  }
  return realUrl.join('/');
}
// TODO fix: if there're multiple script this code doesnt work
function getScripts(file, observed) {
  file = removeDotDot(file);
  var html = fs.readFileSync(file, "utf-8");
  var current_dir = getCurrentDir(file);
  return new Promise(function(resolve,reject){
    jsdom.env(html,function(err, window){
      if (err){
        reject(err);
        return;
      }
      var $ = jquery(window);
      var $scripts = $('script');
      var $imports = $('link[rel="import"]');
      var promises = [];
      if ($imports){
        $imports.each(function(index){
          var file_dir = current_dir + $(this).attr('href');
          promises.push(getScripts(file_dir, observed));
        });
      }
      if (promises.length >0){
        Promise.all(promises).then(function(values){
          var reduced = values.reduce(function(a,b){
            if (!(a instanceof Array)){
              a = [a];
            }
            if (b instanceof Array) {
              return a.concat(b);
            } else {
              return a.push(b);
            }
          });
          if (!(reduced instanceof Array)) reduced = [reduced];
          var current = {file:file, script:$script};
          reduced.push(current);
          resolve(reduced);
        });
      } else {
        resolve({file:file, script:$script});
      }
    });
  });
}
function removeRepeted(list) {
  var repeted = [];
  var i = 0;
  while(i<list.length){
    if(repeted.indexOf(list[i].file) == -1){
      repeted.push(list[i].file);
      i++;
    } else {
      list.splice(i,1);
    }
  }
  return list;
}

function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
function createTmp(){
  if (fs.existsSync(TMP_FOLDER)){
    deleteFolderRecursive(TMP_FOLDER);
  }
  fs.mkdirSync(TMP_FOLDER);
}
function createFiles(files){
  var new_dir = [];
  var errrFn = function(err, file){
    if (err) {
      console.log(err);
      return;
    }
  }
  for (var i=0;i<files.length;i++){
    var file_name = files[i].file.replace('./','');
    file_name = file_name.replace(/\//g,'_');
    file_name = file_name.replace(/\.html$/g,'.js');
    var filepath = TMP_FOLDER + file_name;
    new_dir.push(filepath);
    console.log('Created file: ', filepath);
    var fd = fs.openSync(filepath, 'w');
    fs.write(fd, files[i].script, null, 'utf8', errFn);
  }
  return new_dir;
};


// MAIN
getScripts(program.component).then(function(results){
  removeRepeted(results);
  createTmp();
  var files_dir = createFiles(results);
  plato.inspect(files_dir, program.output, {}, function(){
    console.log('Generated results');
    deleteFolderRecursive(TMP_FOLDER);
  });

},function(err){
  console.log('algo fue mal');
});
