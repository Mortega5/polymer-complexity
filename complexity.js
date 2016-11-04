#!/usr/bin/env node

// DEPENDENCIES
var program = require('commander');
var jsdom = require('jsdom');
var fs = require('fs');
var jquery = require("jquery");
var Promise = require('promise');
var plato = require('plato');
var http = require('http');
var https = require('https');

// STATIC FOLDER
var TMP_FOLDER = '.tmp_plato/';

// Program options
program
.version('1.0.0')
.option('-o --output <output>', 'Directory of output will be stored')
.option('-r --recursive', 'Enable recursive analyze')
.option('-delete','Remove output folder if exist')
.option('-server','Deploy a server after execute') // necesario?
.arguments('<component>')
.action(function(component){
  program.component = component;
})
.parse(process.argv);
if (typeof  program.component === 'undefined' || typeof program.output === 'undefined'){
  program.help();
}

// Auxiliar functions
function getCurrentDir(file){
  var split = file.split('/');
  split.length = split.length -1;
  return split.join('/') + '/';
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
function getScriptFromUrl(url){
  return new Promise(function(resolve,reject){
    var script="";
    var protocol= url.match(/^https/) ? https:http;
    var request = protocol.get(url, function(response) {
      if (response.statusCode !== 200){
        reject(response);
      } else {
        response.setEncoding('utf8');
        response.on('data', function(chunk){ script += chunk;});
        response.on('end',function(){
          resolve([{file:url, script:script}]);
        });
      }
    });
  });
}
function getScriptFromScript(file){
  return new Promise(function(resolve, reject){
    file = removeDotDot(file);
    fs.readFile(file,function(err, script){
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve([{file:file,script:script}]);
      }
    });
  });
}
function getScripts(file, recursive) {
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
      var $script = "";
      var $imports = $('link[rel="import"]');
      var promises = [];

      // get scripts
      $('script').each(function(index){
        // script element
        var $el = $(this);
        // script source if exist
        var src = $el.attr('src');
        // if its a local file, folder
        var file_dir;
        if (src){
          if (recursive){
            if(src.match(/^https?/)){
              promises.push(getScriptFromUrl(src));
            } else {
              file_dir = current_dir + src;
              promises.push(getScriptFromScript(file_dir));
            }
          }
        } else { // is a explicit script
          $script = $script + $el.html() + '\n';
        }
      });
      // get imports
      if ($imports && recursive){
        $imports.each(function(index){
          var file_dir = current_dir + $(this).attr('href');
          promises.push(getScripts(file_dir, recursive));
        });
      }
      if (promises.length >0){
        Promise.all(promises).then(function(values){
          var reduced = values.reduce(function(a,b){
            return a.concat(b);
          });
          var current = {file:file, script:$script};
          reduced.push(current);
          resolve(reduced);
        });
      } else {
        resolve([{file:file, script:$script}]);
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
  function errFn(err, file){
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
}


// MAIN
getScripts(program.component, program.recursive).then(function(results){
  removeRepeted(results);
  createTmp();
  var files_dir = createFiles(results);
  plato.inspect(files_dir, program.output || 'results', {}, function(results){
    console.log('Generated results');
    deleteFolderRecursive(TMP_FOLDER);
  });

},function(err){
  console.log('algo fue mal');
});
