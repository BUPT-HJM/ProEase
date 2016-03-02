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
    var settingNew = settingStore;
    settingNew.projectsDir = document.getElementById('projectsDir').value;
    settingNew.vendorDir = document.getElementById('vendorDir').value;
    fs.writeFile(find.fileSync(/^setting\.json$/,__dirname)[0],JSON.stringify(settingNew, null, 4),false);

    settingStore = settingNew;
    mainSwiper.slideTo(0, 0, false);
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
  };
};




















