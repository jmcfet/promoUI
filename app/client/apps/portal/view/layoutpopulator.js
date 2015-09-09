var $N = null;
$(document).ready(function () {
   
    start();
    
   
});

function start() {
   
    var netMdsServer = 'http://localhost:51478/app/client/apps' + '/portal/images/';
    if (opener) {
         $N = opener.$N;
    }
    var cnt = 0;
    var images = [netMdsServer + 'two.png', netMdsServer + 'three.png', netMdsServer + 'threethree.png', netMdsServer + 'onethree.png'];
  
    images.forEach(function callback() {
      
        var elem1 = document.createElement("div");
        elem1.setAttribute("class", "imageDiv");
        elem1.onclick = clicked;
        document.getElementById("images").appendChild(elem1);
        var img1 = document.createElement("img");
        img1.setAttribute("class", "image");
        img1.src =images[cnt++];
        document.getElementById("images").appendChild(elem1);
        elem1.appendChild(img1);
    });

   
}

function clicked(e) {
    var url = e.srcElement.src;
    $N.app.PortalWindow.layoutselected(url);
    window.close();
   // var big = document.getElementById('bigimage').style.backgroundImage = e.srcElement.style.backgroundImage;
}
