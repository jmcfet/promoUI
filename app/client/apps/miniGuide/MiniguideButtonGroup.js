/*global Zapper*/
var $N = window.parent.$N;
/**
 * @class MiniguideButtonGroup
 * @constructor
 * @param {Object} docRef Reference to the document the list should be created in
 * @param {Object} parent The GUI object that this object should be attached to
 */
function MiniguideButtonGroup(docRef, parent) {
    MiniguideButtonGroup.superConstructor.call(this, docRef);
    this._log = new $N.apps.core.Log('MINIGUIDE', 'MiniguideButtonGroup');
    $N.apps.core.Language.adornWithGetString(MiniguideButtonGroup);

    // buttons
    this._buttonGroup = new $N.gui.ListGroup(docRef);

    this._infoItem = new $N.gui.ListItem(docRef, this._buttonGroup);
    this._languageItem = new $N.gui.ListItem(docRef, this._buttonGroup);
    this._subtitlesItem = new $N.gui.ListItem(docRef, this._buttonGroup);
    this._optionsItem = new $N.gui.ListItem(docRef, this._buttonGroup);

    this._infoButton = new $N.gui.Container(docRef, this._infoItem);
    this._languageButton = new $N.gui.Container(docRef, this._languageItem);
    this._subtitlesButton = new $N.gui.Container(docRef, this._subtitlesItem);
    this._optionsButton = new $N.gui.Container(docRef, this._optionsItem);

    this._infoString = new $N.gui.Label(docRef, this._infoItem);
    this._languageString = new $N.gui.Label(docRef, this._languageItem);
    this._subtitlesString = new $N.gui.Label(docRef, this._subtitlesItem);
    this._optionsString = new $N.gui.Label(docRef, this._optionsItem);

    this._TEXT_OFFSET = 13.5;

    this._buttonGroup.configure({
        x: 575,
        y: 136.5
    });

    this._infoItem.configure({
        cssClass: "miniguideButtonGroupItem"
    });

    this._languageItem.configure({
        cssClass: "miniguideButtonGroupItem"
    });

    this._subtitlesItem.configure({
        cssClass: "miniguideButtonGroupItem"
    });

    this._optionsItem.configure({
        cssClass: "miniguideButtonGroupItem"
    });

    this._infoButton.configure({
        cssClass: "redButton"
    });

    this._infoString.configure({
        text: Zapper.getString("info"),
        cssClass: "miniguideButtonText"
    });

    this._languageButton.configure({
        cssClass: "greenButton"
    });

    this._languageString.configure({
        text: Zapper.getString("unavailable"),
        cssClass: "miniguideButtonText"
    });

    this._subtitlesButton.configure({
        cssClass: "yellowButton"
    });

    this._subtitlesString.configure({
        text: Zapper.getString("unavailable"),
        cssClass: "miniguideButtonText"
    });

    this._optionsButton.configure({
        cssClass: "blueButton"
    });

    this._optionsString.configure({
        text: Zapper.getString("options"),
        cssClass: "miniguideButtonText"
    });

    this.isEventInfoAvailable = null;

    this._rootSVGRef = this._buttonGroup.getRootSVGRef();
    if (parent) {
        parent.addChild(this);
    }
}

$N.gui.Util.extend(MiniguideButtonGroup, $N.gui.GUIObject);
$N.apps.core.Language.adornWithGetString(MiniguideButtonGroup, "customise/resources/");

MiniguideButtonGroup.prototype.setAudioTrackLabel = function (languageName) {
	this._languageString.setText(languageName);
};
/**
 * Gets the current label text for audio
 * @method getAudioTrackText
 */
MiniguideButtonGroup.prototype.getAudioTrackText = function () {
	return this._languageString.getText();
};
/**
 * Gets the current label text for subtitle
 * @method getSubtitleText
 */
MiniguideButtonGroup.prototype.getSubtitleText = function () {
	return this._subtitlesString.getText();
};

MiniguideButtonGroup.prototype.setSubtitleCssClass = function (cssClass) {
	this._subtitlesString.setCssClass(cssClass);
};

MiniguideButtonGroup.prototype.setAudioCssClass = function (cssClass) {
	this._languageString.setCssClass(cssClass);
};

MiniguideButtonGroup.prototype.setSubtitleLabel = function (subtitleName) {
	this._subtitlesString.setText(subtitleName);
};

MiniguideButtonGroup.prototype.setOptionsLabel = function (optionName) {
	this._optionsString.setText(optionName);
};

MiniguideButtonGroup.prototype.setAudioTrackIconActive = function (active) {
	if (active) {
		this._languageButton.removeCssClass("inactive");
	} else {
		this._languageButton.addCssClass("inactive");
	}
};

MiniguideButtonGroup.prototype.setSubtitleIconActive = function (active) {
	if (active) {
		this._subtitlesButton.removeCssClass("inactive");
	} else {
		this._subtitlesButton.addCssClass("inactive");
	}
};

MiniguideButtonGroup.prototype.setInfoIconActive = function (state) {
	if (state) {
		this._infoButton.removeCssClass("inactive");
	} else {
		this._infoButton.addCssClass("inactive");
	}
};

MiniguideButtonGroup.prototype.setOptionsIconActive = function (state) {
	if (state) {
		this._optionsButton.removeCssClass("inactive");
	} else {
		this._optionsButton.addCssClass("inactive");
	}
};

/**
 * @method showButtons
 */
MiniguideButtonGroup.prototype.showButtons = function () {
	this._log("showButtons", "Enter");
	var i,
		count,
		controls = null;
	if (this.isEventInfoAvailable) {
		// if event data is available then show all the available buttons.
		controls = [this._languageItem, this._subtitlesItem, this._subtitlesString, this._optionsItem ];
	} else {
		// if event data is not available then show all the available buttons except options button.
		controls = [this._languageItem, this._subtitlesItem ];
	}
	count = controls.length;
	for (i = 0; i < count; i++) {
		controls[i].show.call(controls[i]);
	}
	this._log("showButtons", "Exit");
};


/**
 * @method showInfoAndOptionsIcons
 * shows the info and options button.
 */

MiniguideButtonGroup.prototype.showInfoAndOptionsIcons = function () {
	this._infoItem.show();
	this._optionsItem.show();
};


/**
 * @method hideInfoAndOptionsIcons
 * hides the info and options button.
 */

MiniguideButtonGroup.prototype.hideInfoAndOptionsIcons = function () {
	this._infoItem.hide();
	this._optionsItem.hide();
};


/**
 * @method setInfoAndOptionsIcons
 * @param {Boolean} hasEventData
 */
MiniguideButtonGroup.prototype.setInfoAndOptionsIcons = function (hasEventData) {
	this._log("setInfoAndOptionsIcons", "Enter");
	this.isEventInfoAvailable = hasEventData;
	if (hasEventData) {
	    this.showInfoAndOptionsIcons();
	} else {
	    this.hideInfoAndOptionsIcons();
	}
	this._log("setInfoAndOptionsIcons", "Exit");
};

/**
 * @method setButtonPositionsAndVisibility
 * @param {Boolean} isDisplayedEventPlaying
 * @param {Boolean} hasEventData
 */
MiniguideButtonGroup.prototype.setButtonPositionsAndVisibility = function (isDisplayedEventPlaying, hasEventData) {
	this._log("setButtonPositionsAndVisibility", "Enter");
	if (isDisplayedEventPlaying) {
		this.setInfoAndOptionsIcons(hasEventData);
		this.showButtons();
	} else {
	    this._languageItem.hide();
	    this._subtitlesItem.hide();
	    this.setInfoAndOptionsIcons(hasEventData);
	}
	this._log("setButtonPositionsAndVisibility", "Exit");
};

/**
 * Returns a string representation of this class
 *
 * @method toString
 * @return {String}
 */
MiniguideButtonGroup.prototype.toString = function () {
    return "MiniguideButtonGroup";
};

