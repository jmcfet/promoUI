var $N = null;
function start() {
   
    
    $N = opener.$N;
//    alert($N.app.PortalWindow.opened);
    debugger;
    var netMdsServer = 'http://localhost:51478/app/client/apps' + '/portal/images/';
  //  var netMdsServer = $N.app.Config.getConfigValue("mds.developer.server") + '/portal/images/';
    var parent = document.getElementById('images');
    var elem = document.createElement("div");
    elem.setAttribute("class", "wide");
    elem.onclick = clicked;
    elem.style.backgroundImage = 'url(' + netMdsServer + 'two.png' + ")";;
    document.getElementById("images").appendChild(elem);
    var elem1 = document.createElement("div");
    elem1.setAttribute("class", "wide");
    elem1.style.backgroundImage = 'url(' + netMdsServer + 'three.png' + ")";
    elem1.onclick = clicked;
    document.getElementById("images").appendChild(elem1);

    elem1 = document.createElement("div");
    elem1.setAttribute("class", "wide");
    elem1.style.backgroundImage = 'url(' + netMdsServer + 'threethree.png' + ")";
    elem1.onclick = clicked;
    document.getElementById("images").appendChild(elem1);

    var elem1 = document.createElement("div");
    elem1.setAttribute("class", "wide");
    elem1.style.backgroundImage = 'url("http://localhost:63543/images/portal_now_224x250_1.jpg")';
    //   elem1.style.backgroundImage = 'url(' + port + 'onethree.png' + ")";
    document.getElementById("images").appendChild(elem1);

    var elem1 = document.createElement("div");
    elem1.setAttribute("class", "wide");
    //       elem1.style.backgroundImage = 'url("http://localhost:63543/images/portal_now_224x250_1.jpg")';
    elem1.style.backgroundImage = 'url("http://localhost:54365/images/portal_now_304x118_3.jpg")';
    document.getElementById("images").appendChild(elem1);
}

function clicked(e) {
   
    var url = e.srcElement.style.backgroundImage;
    $N.app.PortalWindow.layoutselected(url);
   // var big = document.getElementById('bigimage').style.backgroundImage = e.srcElement.style.backgroundImage;
}
