/**
 * @class PPVConfirmationDialog
 * @extends ConfirmationDialog
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
(function ($N) {
	var proto,
		IMAGE_LOCAL_PATH = "customise/resources/images/net/",
		DEFAULT_IMAGE = "camera.png",
		me = null,
		PPVConfirmationDialog = function (docRef, parent) {
			PPVConfirmationDialog.superConstructor.call(this, docRef);
			me = this;
			this._ppvIcon = new $N.gui.Image(docRef, this._backgroundContainer);
			this._ppvOkCallback = function () {};
			this._purchaseObject = null;
			this._posterImageServer = $N.app.epgUtil.getPosterImageServer();
			//configure the PPV Event image  
			this._titleImage.configure({
				x: 375,
				y: 145 + this.DIALOGUE_BACKPLATE_Y,
				height: 195,
				width: 336,
				visible : true,
				href : IMAGE_LOCAL_PATH + DEFAULT_IMAGE,
				loadFailedCallback : function () {
					me._titleImage.setHref(IMAGE_LOCAL_PATH + DEFAULT_IMAGE);
				}
			});

			//configure the PPV channel icon
			this._ppvIcon.configure({
				x : 670,
				y : 365 + this.DIALOGUE_BACKPLATE_Y,
				href: "customise/resources/images/%RES/icons/optionIcons/smaller_ticket_stub.png",
				visible : true
			});

			//configure the service/channel name.
			this._dialogueTypeLabel = new $N.gui.Label(docRef, this._container);
			this._dialogueTypeLabel.configure({
				x : 373,
				y : 83 + this.DIALOGUE_BACKPLATE_Y,
				cssClass: "PPVDefaultText"
			});

			//configure purchase rate text.
			this._alertImageText.configure({
				x : 735,
				y : 358 + this.DIALOGUE_BACKPLATE_Y,
				visible: true,
				cssClass: "zapperTitle textUbuntuMedium"
			});

			//configure the genreInfo text label.
			this._alertImageSubText.configure({
				x : 775,
				y : 303 + this.DIALOGUE_BACKPLATE_Y,
				cssClass: "PPVDefaultText",
				visible: true
			});

			//configure the confirmation text of the dialog.
			this._highlightedItemLabel.configure({
				x : 373,
				y : 550 + this.DIALOGUE_BACKPLATE_Y,
				width : 1000,
				cssClass : "PPVSubText"
			});

			//configure the parental rating icon.		
			this._alertImage.configure({
				x : 735,
				y : 310 + this.DIALOGUE_BACKPLATE_Y,
				width: 30,
				height: 28.5,
				opacity : 1,
				visible : true
			});
			this._menu.configure({
				visible : false
			});
			this._container.addChild(this._dialogueTypeLabel);
		};
	$N.gui.Util.extend(PPVConfirmationDialog, $N.gui.ConfirmationDialog);

	$N.gui.PPVConfirmationDialog = PPVConfirmationDialog;

	proto = PPVConfirmationDialog.prototype;

	/**
	 * This method is to reposition the title and message, which
	 * gets positioned automatically during object creation
	 * @method refreshPPVPositions
	 * @public
	 */
	proto.refreshPPVPositions = function () {
		this._title.configure({
			x: 735,
			y: 135 + this.DIALOGUE_BACKPLATE_Y,
			cssClass: "textUbuntuMedium PPVEventTitle"
		});
		this._messageText.configure({
			x: 735,
			y: 224 + this.DIALOGUE_BACKPLATE_Y,
			cssClass: "PPVDefaultText"
		});
		this._alertImage.show();
	};

	/**
     * To set the config for alert image. It overwrites
     * the same method in parent class 
     * @method setAlertImage
	 * @public 
     */
	proto.setAlertImage = function (configObj) {
		this._alertImage.configure(configObj);
	};

	/**
     * To set the text for dialogueTypeLabel and it overwrites 
     * the method in parent class  
     * @method setDialogueTypeLabel
	 * @public 
     */
	proto.setDialogueTypeLabel = function (text) {
		this._dialogueTypeLabel.setText(text);
	};

	/**
     * To set the config for alert image sub text. It overwrites
     * the same method in parent class  
     * @method setAlertImageSubTextConfig
	 * @public 
     */
	proto.setAlertImageSubTextConfig = function (config) {
		if (config) {
			this._alertImageSubText.configure(config);
		}
	};

	/**
     * To set the href for title image. It overwrites
     * the same method in parent class  
     * @method setTitleImage
	 * @public 
     */
	proto.setTitleImage = function (href) {
		if (href) {
			this._titleImage.setHref(href);
		}
	};

	/**
     * To set the href for title image. It overwrites
     * the same method in parent class  
     * @method setTitleImageFromEvent
	 * @public 
     */
	proto.setTitleImageFromEvent = function (event) {
		var imgHref = null,
			me = this;
		if (event) {
			if (event.promoImage) {
				this._titleImage.setHref(this._posterImageServer + event.promoImage);
			} else {
				$N.app.PPVHelper.loadEventImage(event, function (result) {
					if (result) {
						if (result.defaultImage) {
							imgHref = IMAGE_LOCAL_PATH + result.defaultImage;
						} else {
							imgHref = this._posterImageServer + result.promoImage;
						}
						me._titleImage.setHref(imgHref);
					}
				});
			}
		}
	};

	/**
     * To set the purchase object which will be sent as
     * parameter for callback that fires on OK press
     * @method setPurchaseObject
	 * @public 
     */
	proto.setPurchaseObject = function (purchaseObject) {
		this._purchaseObject = purchaseObject;
	};

	/**
     * To set the callback which will be fired on OK press
     * @method setPPVOkCallback
	 * @public 
     */
	proto.setPPVOkCallback = function (callback) {
		this._ppvOkCallback = callback;
	};

	/**
     * To set the text for label that appears with
     * helper text to purchase
     * @method setHighlightedItemLabelText
	 * @public 
     */
	proto.setHighlightedItemLabelText = function (text) {
		this._highlightedItemLabel.setText(text);
	};

	/**
	 * Overrides the superclass keyHandler to handle 
	 * OK key for PPV 
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	proto.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		switch (key) {
		case keys.KEY_OK:
			if (this._ppvOkCallback && typeof (this._ppvOkCallback) === "function") {
				this.invokeCallback(key);
				this._ppvOkCallback(this._purchaseObject);
			}
			return true;
		default:
			return PPVConfirmationDialog.superClass.keyHandler.call(this, key);
		}
	};
	$N.apps.core.Language.adornWithGetString(PPVConfirmationDialog);
}($N || {}));