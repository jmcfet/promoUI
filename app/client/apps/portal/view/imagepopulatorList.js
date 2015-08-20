var $N = null;
var url = null;
var fileinfo = null;
var netMdsServer = null;
var cnt = 0;
function start() {
    var url = purl(document.location);
    var param1 = url.param("title");
    netMdsServer = url.param("imageurl") + '/portal/images/';
   
    //$N = window.$N;
    //if (!$N) {
    //    alert('called in wrong context');
    //    return;
    //}
   
 //   netMdsServer = 'http://localhost:55619/client/apps' + '/portal/images/';
    var parent = document.getElementById('images');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", 'portalimages.json', false);
    xmlhttp.send();
    fileinfo = JSON.parse(xmlhttp.responseText);
    for (var cnt = 0; cnt < fileinfo.items.length; cnt++) {
        //create new li element
        var elem = document.createElement("li");
        elem.setAttribute("class", "listitem");
        elem.onclick = clicked;
        //create new text node
        var numberListValue = document.createTextNode(fileinfo.items[cnt].name);
        //add text node to li element
        elem.appendChild(numberListValue);
        //add new list element built in previous steps to unordered list
        document.getElementById("images").appendChild(elem);

           
    }
       
   
    //select the first image
    document.getElementById('NameContents').innerHTML = '<b>Name: </b> ' + fileinfo.items[0].name;
    document.getElementById('TypeContents').innerHTML = '<b>Type: </b> ' + 'EPG';
    document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + fileinfo.items[0].image;
    document.getElementById('bigimage').src = netMdsServer + fileinfo.items[0].image;
}

function clicked(e) {
   
    window.filename = filename = e.currentTarget.innerHTML;
    for ( cnt = 0; cnt < fileinfo.items.length; cnt++) {
        if (fileinfo.items[cnt].name === filename) {
            document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[cnt].name;
            document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + filename;
            document.getElementById('imageUrl').innerHTML = '<b>Image: </b> ' + filename;
            document.getElementById('bigimage').src = netMdsServer + fileinfo.items[cnt].image;
            break;
        }
    }
 //   document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[0].
}

function selectedclicked(cnt) {
    //if (!cnt) {
    //    alert('image must be selected');
    //    return;
    //}
    //$N.app.PortalWindow.opened(netMdsServer + fileinfo.items[cnt].image);

    //  window.close();
    window.location.href = "tab1.html?imageurl=" + document.getElementById('bigimage').src;
    
    var newWindow = window.open("tab1.html");
 //   opener.callback(window.filename);
   

}
