/**
 * The PortalWindow class manages the area to the right of the portal which houses links and advertisements
 * @class PortalWindow
 * @constructor
 */
var $N = window.parent.$N;
$N.app.PortalWindow = (function () {
	var log = new $N.apps.core.Log("Portal", "PortalWindow"),
		view = {},
		exitCallback = function () {},
		isPreviewed = false,
		currentMode = null,
        cellNumber = null,     //jrm
        data = null,       //jrm
        activationObject,   //jrm
        title = null,
        url = null,
        currentCell = null,
		currentTable = null;
        

	/**
	 * @method setTable
	 * @param {String} currentMode
	 * @private
	 */
	function setTable(currentMode) {
		var targetTable = null;
		switch (currentMode) {
		case "music":
			targetTable = view.musicTable;
			break;
		case "messages":
			targetTable = view.messagesTable;
			break;
		case "settings":
			targetTable = view.settingsTable;
			break;
		default:
			targetTable = view.guideTable;
			break;
		}
		if (targetTable) {
			currentTable = targetTable;
			currentTable.show();
		}
	}
    // a image was selected from the image selector window so we need to refresh the selected cell
	function opened(url) {
	    
	    //var lastslash = url.lastIndexOf('/');
	    //var newImage = url.slice(lastslash + 1, url.length);
	
	    currentItem = window.$N.app.PortalWindow.activationObject.data.items[this.cellNumber - 1];
	    currentItem.data.text = window.$N.app.PortalWindow.title;
	    currentItem.data.localHref = '/portal/images/' + window.$N.app.PortalWindow.url;
	    window.$N.app.PortalWindow.preview(window.$N.app.PortalWindow.activationObject);
	}
	function layoutselected(url) {

	    
	    var lastslash = url.lastIndexOf('/');
	    var lastsdot = url.lastIndexOf('.');
	    var layout = url.slice(lastslash + 1, lastsdot);
	    $N.app.PortalUtil.getWindowData(layout, function (data) {
	        window.$N.app.PortalWindow.activationObject.data = data;
	        window.$N.app.PortalWindow.preview(window.$N.app.PortalWindow.activationObject);
	       
	    })
       
	}
    /**
	 * @method clicked
	 * @param e mouse click event
	 * @private
	 */
	function clicked(e) {
	   //find the cell that was clicked on
	    items = currentTable._tableItems;    // from closure
	    var cell = document.elementFromPoint(e.x, e.y);
	    //for (i = 0; i < currentTable._itemCount; i++) {
	    //    if ((e.x > items[i]._trueX && e.x < items[i]._trueX + items[i]._width)  &&
        //        (e.y > items[i]._trueY && e.y < items[i]._trueY + items[i]._height)) {
	    //        currentCell = items[i];
	    //        window.$N.app.PortalWindow.target = i + 1;
	    //        break;
	    //    }
                
	    //}
	    for (i = 0; i < currentTable._itemCount; i++) {
	        
	        if (cell.innerText == items[i].getRootElement().innerText) {
	            currentCell = items[i];
	            window.$N.app.PortalWindow.cellNumber = i + 1;
	            break;
	        }

	    }
	    if (!currentCell) {
	        alert('logic error in hit testing');
	        return;
	    }
	    window.$N.app.PortalWindow.currentCell = currentCell;
	    
	
	   
	    //	    var newwindow = window.open('tab1.html');
	    var newwindow = window.open('tab1.html','mywin2', 'screenX=200,screenY=400,width=800,height=800,toolbar=0,location=0,resizable=1');
	    //newwindow.onclose = function () {
	    //    debugger;
	    //}
	   
    }                            //jrm
	/**
	 * @method recordingsItemHighlighted
	 * @param {Object} data
	 * @private
	 */
	function recordingsItemHighlighted(data) {
		if (data.data.startTime) {
			view.recordingsItemLabel.setText($N.app.DateTimeUtil.getRecordedOnString(data.data.startTime) + ".");
		} else {
			view.recordingsItemLabel.setText("");
		}
		view.recordingsItemLabel.show();
	}

	/**
	 * @method initialise
	 * @param {Function} exitCallback
	 */
	function setExitCallback(windowExitCallback) {
		exitCallback = windowExitCallback;
	}

	/**
	 * @method initialise
	 * @param {Object} windowView
	 */
	function initialise(windowView) {
		log("initialise", "Enter");
		view = windowView;
		view.addFadeAnimation().setAnimationDuration('200ms');
		view.guideTable.initialise();
		view.guideTable.setDataMapper($N.app.DataMappers.getServiceDataMapper());
		view.recordingsTable.setItemHighlightedImmediateCallback(recordingsItemHighlighted);
		view.recordingsTable.initialise();
		view.recordingsTable.setDataMapper($N.app.DataMappers.getServiceDataMapper());
		view.musicTable.initialise();
		view.settingsTable.initialise();
		log("initialise", "Exit");
	}

	/**
	 * @method setEmptyText
	 * @param {Boolean} withData, true if we are previewing with data, false if no data
	 * @param {Object} currentMode
	 */
	function setEmptyText(withData, currentMode) {
		log("setEmptyText", "Enter");
		var text = null;
		if (currentMode === "messages") {
			text = withData ? "" : $N.app.PortalWindow.getString("noMail");
			view.messagesTable.setEmptyText(text);
		}
		if (currentMode === "PVR") {
			text = withData ? "" : $N.app.PortalWindow.getString("noRecordings");
			view.recordingsTable.setEmptyText(text);
		}
		log("setEmptyText", "Exit");
	}

	/**
	 * @method preview
	 * @param {Object} activationObject
	 */
	function preview(activationObject) {
		log("preview", "Enter");
		var data = activationObject.data,
			withData = data && data.items && data.items.length;
		currentMode = activationObject.mode;
		view.recordingsItemLabel.hide();
		if (withData || (currentMode === "messages") || (currentMode === "PVR")) {
			setEmptyText(withData, currentMode);
			setTable(currentMode);
			if (currentTable) {
				currentTable.preview(data);
			}
			view.setOpacity(0);
			view.show();
			view.doFade(1);
		}
		if (currentMode === "guide") {
			$N.app.TimerUtil.startTimer();
		}
		isPreviewed = true;
		log("preview", "Exit");
	}

	/**
	 * @method activate
	 */
	function activate(activationObject) {
		log("activate", "Enter");
//		if (!isPreviewed) {       jrm
			preview(activationObject);
//		}
		if (currentTable) {
			currentTable.activate();
		}
		log("activate", "Exit");
	}

	/**
	 * @method passivate
	 */
	function passivate() {
		log("passivate", "Enter");
		if (currentTable) {
			currentTable.passivate();
		}
		view.recordingsItemLabel.hide();
		log("passivate", "Exit");
	}

	/**
	 * @method unPreview
	 */
	function unPreview() {
		log("unPreview", "Enter");
		view.hide();
		if (currentTable) {
			currentTable.hide();
		}
		passivate();
		if (currentMode === "guide") {
			$N.app.TimerUtil.stopTimer();
		}
		isPreviewed = false;
		log("unPreview", "Exit");
	}

	/**
	 * @method keyHandler
	 */
	function keyHandler(key) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		if (currentTable) {
			handled = currentTable.keyHandler(key);
		}

		if (!handled) {
			switch (key) {
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				exitCallback();
				handled = true;
				break;
			}
		}
		log("keyHandler", "Exit");
		return handled;
	}

	/**
	 * @method refreshData
	 */
	function refreshData(data) {
		if (currentTable && currentTable.setData) {
			currentTable.setData(data);
		}
	}

	/**
	 * @method getCurrentTable
	 * returns the current table
	 */
	function getCurrentTable() {
		return currentTable;
	}

	return {
		setExitCallback: setExitCallback,
		initialise: initialise,
		clicked: clicked,
		opened: opened,      //jrm
		title: title,
        url:url,
		layoutselected:layoutselected,
		activationObject:activationObject,
		preview: preview,
		activate: activate,
		passivate: passivate,
		unPreview: unPreview,
		keyHandler: keyHandler,
        currentCell:currentCell,
		getCurrentTable: getCurrentTable,
		currentTable:currentTable,
		refreshData : refreshData
	};
}());
$N.apps.core.Language.importLanguageBundleForObject($N.app.PortalWindow, null, "apps/portal/common/", "LanguageBundle.js", null, window);
