﻿$(function () {
    var page = $('.all-products');
    page.addClass('visible');
    var netMdsServer = 'http://localhost:51478/app/client/apps' + '/portal/images/';
    debugger;
    if (opener) {

        var $N = window.$N = opener.$N;
        var portal = $N.app.PortalWindow;
        var currentCell = portal.currentCell;

        if (currentCell) {
            netMdsServer = $N.app.Config.getConfigValue("mds.developer.server") + '/portal/images/';
            document.getElementById('NameContents').innerHTML = '<b>Position: </b> ' + portal.cellNumber;
            if (opener.filename) {   //if called by child window
                document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + opener.filename;
            }
        }
        else {
            alert('logic error no currentCell');
        }
    }
    var parent = document.getElementById('images');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", 'portalimages.json', false);
    xmlhttp.send();
    fileinfo = JSON.parse(xmlhttp.responseText);
    for (var cnt = 0; cnt < fileinfo.items.length; cnt++) {
        //create new li element
        var elem = document.createElement("li");
        elem.setAttribute("class", "listitem");
        elem.onclick = imagenameclicked;
        //create new text node
        var numberListValue = document.createTextNode(fileinfo.items[cnt].name);
        //add text node to li element
        elem.appendChild(numberListValue);
        //add new list element built in previous steps to unordered list
        document.getElementById("images").appendChild(elem);


    }


    //select the first image
    document.getElementById('assetName').innerHTML = '<b>Name: </b> ' + fileinfo.items[0].name;
    document.getElementById('TypeContents').innerHTML = '<b>Type: </b> ' + 'EPG';
    document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + fileinfo.items[0].image;
    if (netMdsServer)
        document.getElementById('bigimage').src = netMdsServer + fileinfo.items[0].image;

    
    var done = $('#doneButton');
    done.on('click', function (e) {
        debugger;
            portal.title = document.getElementById('title').value;
            portal.url = document.getElementById('imageUrlPicker').value;
            portal.opened();
        

    });
    var search = $('#searchit');
    search.on('click', function (e) {

        window.location.hash = 'page2';

    });
    var page2 = $('#selectbutton');
    page2.on('click', function (e) {

        window.location.hash = 'page1';

    });

    function searchClicked(){

    };
    function imagenameclicked(e) {

        window.filename = filename = e.currentTarget.innerHTML;
        for (cnt = 0; cnt < fileinfo.items.length; cnt++) {
            if (fileinfo.items[cnt].name === filename) {
                document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[cnt].name;
                document.getElementById('AssetContents').innerHTML = '<b>Asset: </b> ' + filename;
                document.getElementById('imageUrlPicker').innerHTML = '<b>Image: </b> ' + fileinfo.items[cnt].image;
                document.getElementById('bigimage').src = netMdsServer + fileinfo.items[cnt].image;
                break;
            }
        }
        //   document.getElementById('NameContents').innerHTML = '<b>Name: </b>' + fileinfo.items[0].
    }

   

    // An event handler with calls the render function on every hashchange.
    // The render function will show the appropriate content of out page.
    $(window).on('hashchange', function () {
        render(window.location.hash);
    });


    // Navigation

    function render(url) {

       
        if (url == '#page2') {
            // Hide whatever page is currently shown.
            $('.main-content .page').removeClass('visible');
            page = $('.all-products');
            page[0].hidden = true;

            var page = $('.single-product'),
                container = $('.preview-large');
            // Show the page.
            page.addClass('visible');
        } else {
            page = $('.single-product');
            page[0].hidden = true;

            var page = $('.all-products');
            // Show the page.
            page[0].hidden=false;
        }

       

    }


   
    
    // Opens up a preview for one of the products.
    // Its parameters are an index from the hash and the products object.
    function renderSingleProductPage(index, data) {

        var page = $('.single-product'),
			container = $('.preview-large');


        // Show the page.
        page.addClass('visible');

    }

   

    // Get the filters object, turn it into a string and write it into the hash.
    function createQueryHash(filters) {

        // Here we check if filters isn't empty.
        if (!$.isEmptyObject(filters)) {
            // Stringify the object via JSON.stringify and write it after the '#filter' keyword.
            window.location.hash = '#filter/' + JSON.stringify(filters);
        }
        else {
            // If it's empty change the hash to '#' (the homepage).
            window.location.hash = '#';
        }

    }

});