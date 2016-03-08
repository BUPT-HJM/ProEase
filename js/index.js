var fs = require('fs');
var settingStore = require('./setting.json')
var find = require('find');
var mkdirp = require('mkdirp');

const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
var menu = new Menu();
menu.append(new MenuItem({ label: '关闭', role: 'close' }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: '最小化', role: 'minimize'}));
window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  menu.popup(remote.getCurrentWindow());
}, false);
const shell = require('electron').shell;
const escapeStringRegexp = require('escape-string-regexp');



var mainSwiper = new Swiper('.mainSwiper',{
});

fs.readdir(settingStore.vendorDir,function(err,files){
  var i = 0;
  while (i < files.length) {
    if (/^\./.test(files[i])) {
      files.splice(i, 1);
    }else {
      i++;
    }
  };
  // alert(files);

  for(var i = 0; i < files.length; i++){
    var newLabel = document.createElement('label');
    newLabel.innerHTML = "<input type=\"checkbox\" name=\"vendor\" value=\"" + files[i] + "\">" + files[i];
    document.querySelector("#projectFrame > div").appendChild(newLabel);
  }
});

var turn2Setting = function(){
  mainSwiper.slideTo(2, 0, false);

  document.getElementById('projectsDir').value = settingStore.projectsDir;
  document.getElementById('vendorDir').value = settingStore.vendorDir;

  document.getElementById('settingReset').onclick = function(){
    document.getElementById('projectsDir').value = settingStore.projectsDir;
    document.getElementById('vendorDir').value = settingStore.vendorDir;
  };

  document.getElementById('settingConfirm').onclick = function(){
    mainSwiper.slideTo(0, 0, false);
    var settingNew = settingStore;
    settingNew.projectsDir = document.getElementById('projectsDir').value;
    settingNew.vendorDir = document.getElementById('vendorDir').value;
    fs.writeFile(find.fileSync(/^setting\.json$/,__dirname)[0],JSON.stringify(settingNew, null, 4),false);

    settingStore = settingNew;
  };
};
document.getElementsByClassName('settingBtn')[0].onclick = turn2Setting;
if (settingStore.projectsDir == "") {
  alert('请先初始化设置');
  turn2Setting();
};

document.getElementsByClassName('newBtn')[0].onclick = function(){
  mainSwiper.slideTo(1, 0, false);

  document.getElementById('newFinish').onclick = function(){
    // alert(document.getElementById("projectInfo").elements.namedItem('date').value);

    var projectInfo = new String();
    projectInfo.name = document.getElementById('projectInfo').elements.namedItem('name').value;
    projectInfo.date = document.getElementById('projectInfo').elements.namedItem('date').value;
    projectInfo.category = document.getElementById('projectInfo').elements.namedItem('category').value;
    projectInfo.client = document.getElementById('projectInfo').elements.namedItem('client').value;

    var newProjectDir;
    if (projectInfo.category == 'auto' || projectInfo.category == 'go') {
      newProjectDir = settingStore.projectsDir + 
                      '/' + projectInfo.category + 
                      '/' + projectInfo.date.substr(0,4) + 
                      '/' + projectInfo.date.substr(5,2) + projectInfo.date.substr(8,2) + 
                      '/' + projectInfo.name + '-' + projectInfo.client;
      // alert(newProjectDir);
      mkdirp.sync(newProjectDir);
      mkdirp.sync(newProjectDir + '/css');
      mkdirp.sync(newProjectDir + '/js');

      // fs.createReadStream(settingStore.pageDir + '/' + projectInfo.client + '/' + 'index.html').pipe(fs.createWriteStream(newProjectDir + '/' + 'index.html'));
      fs.createReadStream(settingStore.pageDir + '/' + projectInfo.client + '/' + 'index.css').pipe(fs.createWriteStream(newProjectDir + '/css/' + 'index.css'));
      fs.createReadStream(settingStore.pageDir + '/' + projectInfo.client + '/' + 'index.js').pipe(fs.createWriteStream(newProjectDir + '/js/' + 'index.js'));

      var projectFrame = [];
      for(var i = 0,j = 0; i < document.getElementById("projectFrame").elements.length; i++){
        if (document.getElementById("projectFrame").elements[i].checked) {
          projectFrame[j] = document.getElementById("projectFrame").elements[i].value;
          j++;
        };
      }
      // alert(projectFrame);

      var htmlPage = fs.createWriteStream(newProjectDir + '/' + 'index.html');
      var rl = require('readline').createInterface({
        input: fs.createReadStream(settingStore.pageDir + '/' + projectInfo.client + '/' + 'index.html')
      });
      rl.on('line',function(line){
        htmlPage.write(line + '\n');

        switch(line.trim()) {
          case '<!-- css block -->':
            for (var i = 0; i < projectFrame.length; i++) {
              if (fs.statSync(settingStore.vendorDir + '/' + projectFrame[i]).isDirectory()) {
                var frameICssFiles = find.fileSync(/\.css$/, settingStore.vendorDir + '/' + projectFrame[i]);
                for (var j = 0; j < frameICssFiles.length; j++) {
                  fs.createReadStream(frameICssFiles[j]).pipe(fs.createWriteStream(newProjectDir + '/css/' + frameICssFiles[j].split("\\").pop()));
                  htmlPage.write('\t\t<link rel="stylesheet" type="text/css" href="css/' + frameICssFiles[j].split("\\").pop() + '">\n');
                };
              }else if(/\.css$/.test(projectFrame[i])){
                fs.createReadStream(settingStore.vendorDir + '/' + projectFrame[i]).pipe(fs.createWriteStream(newProjectDir + '/css/' + projectFrame[i]));
                htmlPage.write('\t\t<link rel="stylesheet" type="text/css" href="css/' + projectFrame[i] + '">\n');
              };
            };
            break;
          case '<!-- js block -->':
            htmlPage.write(fs.readFileSync(settingStore.pageDir + '/' + projectInfo.category + '.html'));
            htmlPage.write('\n\n');
            
            for (var i = 0; i < projectFrame.length; i++) {
              if (fs.statSync(settingStore.vendorDir + '/' + projectFrame[i]).isDirectory()) {
                var frameIJsFiles = find.fileSync(/\.js$/, settingStore.vendorDir + '/' + projectFrame[i]);
                for (var j = 0; j < frameIJsFiles.length; j++) {
                  fs.createReadStream(frameIJsFiles[j]).pipe(fs.createWriteStream(newProjectDir + '/js/' + frameIJsFiles[j].split("\\").pop()));
                  htmlPage.write('\t\t<script type="text/javascript" src="js/' + frameIJsFiles[j].split("\\").pop() + '"></script>\n');
                };
              }else if(/\.js$/.test(projectFrame[i])){
                fs.createReadStream(settingStore.vendorDir + '/' + projectFrame[i]).pipe(fs.createWriteStream(newProjectDir + '/js/' + projectFrame[i]));
                htmlPage.write('\t\t<script type="text/javascript" src="js/' + projectFrame[i] + '"></script>\n');
              };
            };
            break;
        };
      }).on('close',() => {
        htmlPage.end();
      });
    };
    
    document.getElementById('projectInfo').reset();
    document.getElementById('projectFrame').reset();
    mainSwiper.slideTo(0, 0, false);
    if (newProjectDir != null) {
      shell.showItemInFolder(newProjectDir);
    };
  };
};

document.getElementsByClassName('viewBtn')[0].onclick = function(){
  mainSwiper.slideTo(3, 0, false);
  document.getElementById('address').focus();
  // clipboard.writeText('hello yo!');

  // http://go.163.com/2015/1204/bosideng/
  // http://s.auto.163.com/2016/0302/a6-wap/
  document.getElementById('address').oninput = function(){
    var address = document.getElementById('address').value;
    var addressInterpreter = new String();

    document.getElementById("testURL").style.backgroundColor = "White";
    document.getElementById("formalURL").style.backgroundColor = "White";
    document.getElementById("dir").style.backgroundColor = "White";
    if (/^http:\/\/test/.test(address)) {
      // 输入的是测试链接
      document.getElementById("formalURL").style.backgroundColor = "Pink";
      document.getElementById("dir").style.backgroundColor = "Pink";

      var result = address.split('/');
      if (result.length >= 7) {
        addressInterpreter.category = result[3];
        addressInterpreter.year = result[4];
        addressInterpreter.monthDay = result[5];
        addressInterpreter.projectName = result[6];
        // alert(addressInterpreter);

        document.getElementById("testURL").value = address;
        if (addressInterpreter.category == 'auto') {
          document.getElementById("formalURL").value = 'http://s.auto.163.com/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
        }else if (addressInterpreter.category == 'go') {
          document.getElementById("formalURL").value = 'http://go.163.com/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
        };
        document.getElementById("dir").value = settingStore.projectsDir+'/'+addressInterpreter.category+'/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/'+'index.html/';
      };
    }else if(/^http:\/\/s/.test(address)){
      // 输入的是正式链接
      document.getElementById("testURL").style.backgroundColor = "Pink";
      document.getElementById("dir").style.backgroundColor = "Pink";

      var result = address.split('/');
      if (result.length >= 6) {
        addressInterpreter.category = result[2].split('.')[1];
        addressInterpreter.year = result[3];
        addressInterpreter.monthDay = result[4];
        addressInterpreter.projectName = result[5];

        if (addressInterpreter.category == 'auto') {
          document.getElementById("testURL").value = 'http://test.auto.163.com/auto/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
        }else if (addressInterpreter.category == 'go') {
          document.getElementById("testURL").value = 'http://test.go.163.com/go/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
        };
        document.getElementById("formalURL").value = address;
        document.getElementById("dir").value = settingStore.projectsDir+'/'+addressInterpreter.category+'/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/'+'index.html/';
      };
    }else if (new RegExp("^" + escapeStringRegexp(settingStore.projectsDir), "g").test(address)) {
      // 输入的是文件夹
      document.getElementById("testURL").style.backgroundColor = "Pink";
      document.getElementById("formalURL").style.backgroundColor = "Pink";

      if (settingStore.projectsDir.split('\\').length > 1) {
        addressInterpreter.category = address.split('\\')[settingStore.projectsDir.split('\\').length-1];
        addressInterpreter.year = address.split('\\')[settingStore.projectsDir.split('\\').length];
        addressInterpreter.monthDay = address.split('\\')[settingStore.projectsDir.split('\\').length+1];
        addressInterpreter.projectName = address.split('\\')[settingStore.projectsDir.split('\\').length+2];
      }else{
        addressInterpreter.category = address.split('/')[settingStore.projectsDir.split('/').length-1];
        addressInterpreter.year = address.split('/')[settingStore.projectsDir.split('/').length];
        addressInterpreter.monthDay = address.split('/')[settingStore.projectsDir.split('/').length+1];
        addressInterpreter.projectName = address.split('/')[settingStore.projectsDir.split('/').length+2];
      }

      if (addressInterpreter.category == 'auto') {
        document.getElementById("testURL").value = 'http://test.auto.163.com/auto/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
      }else if (addressInterpreter.category == 'go') {
        document.getElementById("testURL").value = 'http://test.go.163.com/go/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
      };
      if (addressInterpreter.category == 'auto') {
        document.getElementById("formalURL").value = 'http://s.auto.163.com/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
      }else if (addressInterpreter.category == 'go') {
        document.getElementById("formalURL").value = 'http://go.163.com/'+addressInterpreter.year+'/'+addressInterpreter.monthDay+'/'+addressInterpreter.projectName+'/';
      };
      document.getElementById("dir").value = address;
    };
  }

  document.getElementById('testURL').onclick = function(){
    shell.openExternal(document.getElementById("testURL").value);
  }
  document.getElementById('formalURL').onclick = function(){
    shell.openExternal(document.getElementById("formalURL").value);
  }
  document.getElementById('dir').onclick = function(){
    shell.showItemInFolder(document.getElementById("dir").value);
  }
  document.getElementById('back').onclick = function(){
    mainSwiper.slideTo(0, 0, false);
  }
}




















