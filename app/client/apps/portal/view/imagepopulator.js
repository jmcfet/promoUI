var $N = null;
var url = null;
var fileinfo = null;
function start() {
   
    debugger;
  //  $N = opener.$N;
//    alert($N.app.PortalWindow.opened);
   
    //    var netMdsServer = $N.app.Config.getConfigValue("mds.developer.server") + '/portal/images/';
    var netMdsServer = 'http://localhost:63855/client/apps' + '/portal/images/';
    var parent = document.getElementById('images');

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", 'portalimages.json', false);
    xmlhttp.send();
   
    fileinfo = JSON.parse(xmlhttp.responseText);
    for (var cnt = 0; cnt < fileinfo.items.length; cnt++) {
        var elem = document.createElement("div");
        elem.setAttribute("class", "mydiv");
       
        var image = document.createElement('img');
        image.src = netMdsServer + fileinfo.items[cnt].image;
        image.setAttribute("class", "myimg");
        image.onclick = clicked;
        elem.appendChild(image);
        document.getElementById("images").appendChild(elem);


    }
   
    //select the first image
    document.getElementById('NameContents').innerHTML = '<b>Name: </b> ' + fileinfo.items[0].name;
    document.getElementById('TypeContents').innerHTML = '<b>Type: </b> ' + 'EPG';
    document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + fileinfo.items[0].image;
    document.getElementById('bigimage').src = netMdsServer + fileinfo.items[0].image;
}

function clicked(e) {
    debugger;
    url = e.currentTarget.src;
    document.getElementById('bigimage').src = url;
    var lastslash = url.lastIndexOf('/');
    var lastsdot = url.lastIndexOf('.');
    var filename = url.slice(lastslash + 1, url.length);
    for (var cnt = 0; cnt < fileinfo.items.length; cnt++) {
        if (fileinfo.items[cnt].image === filename) {
            document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[cnt].name;
            document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + filename;
        }
    }
 //   document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[0].
}

function selectedclicked(e) {
    //if (!url) {
    //    alert('image must be selected');
    //    return;
    //}
    window.close();
    window.open("tab1.html");
//    $N.app.PortalWindow.opened(url);
}
