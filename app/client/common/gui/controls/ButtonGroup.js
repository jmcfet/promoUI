/**
 * @author aprice
 * @class ButtonGroup
 * @constructor
 * @param {Object} docRef Reference to the document the list should be created in
 * @param {Object} parent The GUI object that this object should be attached to
 *
 */

(function ($N) {
	"use strict";

	function ButtonGroup(docRef, parent) {
		ButtonGroup.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log('CommonGUI', 'ButtonGroup');
		$N.apps.core.Language.adornWithGetString(ButtonGroup);

		this._container = new $N.gui.Group(docRef);
		// buttons
		this._buttonGroup = new $N.gui.Group(docRef, this._container);
		this._infoButton = new $N.gui.Image(docRef, this._buttonGroup);
		this._languageButton = new $N.gui.Image(docRef, this._buttonGroup);
		this._subtitlesButton = new $N.gui.Image(docRef, this._buttonGroup);
		this._optionsButton = new $N.gui.Image(docRef, this._buttonGroup);
		this._infoString = new $N.gui.Label(docRef, this._buttonGroup);
		this._languageString = new $N.gui.Label(docRef, this._buttonGroup);
		this._subtitlesString = new $N.gui.Label(docRef, this._buttonGroup);
		this._optionsString = new $N.gui.Label(docRef, this._buttonGroup);
		this._TEXT_OFFSET = 6;
		this._BUTTON_WIDTH = 42;
		this._BUTTON_HEIGHT = 42;
		this._OPTION_X = 675;
		this._OPTION_NEXT_VIEW_X = 180;
		this._languageButton.configure({
			href: $N.app.constants.INACTIVE_LANGUAGE_BUTTON_PATH,
			width: this._BUTTON_WIDTH,
			height: this._BUTTON_HEIGHT
		});
		this._languageString.configure({
			text: ButtonGroup.getString("unavailable"),
			x: this._languageButton.getTrueWidth() + this._TEXT_OFFSET,
			y: 33,
			cssClass: "miniguideButtonText"
		});
		this._subtitlesButton.configure({
			href: $N.app.constants.INACTIVE_SUBTITLE_BUTTON_PATH,
			x: 250,
			width: this._BUTTON_WIDTH,
			height: this._BUTTON_HEIGHT
		});
		this._subtitlesString.configure({
			text: ButtonGroup.getString("unavailable"),
			x: 250 + this._subtitlesButton.getTrueWidth() + this._TEXT_OFFSET,
			y: 33,
			cssClass: "miniguideButtonText"
		});
		this._infoButton.configure({
			href: $N.app.constants.INACTIVE_INFO_BUTTON_PATH,
			width: this._BUTTON_WIDTH,
			height: this._BUTTON_HEIGHT
		});
		this._infoString.configure({
			text: ButtonGroup.getString("info"),
			x: this._infoButton.getTrueWidth() + this._TEXT_OFFSET,
			y: 33,
			cssClass: "miniguideButtonText"
		});
		this._optionsButton.configure({
			href: $N.app.constants.INACTIVE_OPTIONS_BUTTON_PATH,
			x: this._OPTION_X,
			width: this._BUTTON_WIDTH,
			height: this._BUTTON_HEIGHT
		});

		this._optionsString.configure({
			text: ButtonGroup.getString("options"),
			x: this._OPTION_X + this._optionsButton.getTrueWidth() + this._TEXT_OFFSET,
			y: 33,
			cssClass: "miniguideButtonText"
		});

		this.isEventInfoAvailable = null;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(ButtonGroup, $N.gui.GUIObject);
	$N.apps.core.Language.adornWithGetString(ButtonGroup, "customise/resources/");
	/**
	 * Gets the current label text for audio
	 * @method setAudioTrackLabel
	 * @param {String} languageName
	 */
	ButtonGroup.prototype.setAudioTrackLabel = function (languageName) {
		this._languageString.setText(languageName);
	};
	/**
	 * Gets the current label text for audio
	 * @method getAudioTrackText
	 */
	ButtonGroup.prototype.getAudioTrackText = function () {
		return this._languageString.getText();
	};
	/**
	 * Gets the current label text for subtitle
	 * @method getSubtitleText
	 */
	ButtonGroup.prototype.getSubtitleText = function () {
		return this._subtitlesString.getText();
	};

	/**
	 * @method setSubtitleCssClass
	 * @param {String} cssClass
	 */
	ButtonGroup.prototype.setSubtitleCssClass = function (cssClass) {
		this._subtitlesString.setCssClass(cssClass);
	};

	/**
	 * @method setAudioCssClass
	 * @param {String} cssClass
	 */
	ButtonGroup.prototype.setAudioCssClass = function (cssClass) {
		this._languageString.setCssClass(cssClass);
	};

	/**
	 * @method setSubtitleLabel
	 * @param {String} subtitleName
	 */
	ButtonGroup.prototype.setSubtitleLabel = function (subtitleName) {
		this._subtitlesString.setText(subtitleName);
	};
	/**
	 * @method setOptionsLabel
	 * @param {String} optionName
	 */
	ButtonGroup.prototype.setOptionsLabel = function (optionName) {
		this._optionsString.setText(optionName);
	};

	/**
	 * @method setAudioTrackIcon
	 * @param {String} hrefIcon
	 */
	ButtonGroup.prototype.setAudioTrackIcon = function (hrefIcon) {
		this._languageButton.setHref(hrefIcon);
	};

	/**
	 * @method setSubtitleLabel
	 * @param {String} hrefIcon
	 */
	ButtonGroup.prototype.setSubtitleIcon = function (hrefIcon) {
		this._subtitlesButton.setHref(hrefIcon);
	};

	/**
	 * @method setInfoIcon
	 * @param {String} state
	 */
	ButtonGroup.prototype.setInfoIcon = function (state) {
		var currentUrl =  this._infoButton.getHref(),
			iconPath = state ? $N.app.constants.ACTIVE_INFO_BUTTON_PATH : $N.app.constants.INACTIVE_INFO_BUTTON_PATH;
		if (currentUrl !== iconPath) {
			this._infoButton.setHref(iconPath);
		}
	};

	/**
	 * @method setOptionsIcon
	 * @param {String} state
	 */
	ButtonGroup.prototype.setOptionsIcon = function (state) {
		var currentUrl =  this._optionsButton.getHref(),
			iconPath = state ? $N.app.constants.ACTIVE_OPTIONS_BUTTON_PATH : $N.app.constants.INACTIVE_OPTIONS_BUTTON_PATH;
		if (currentUrl !== iconPath) {
			this._optionsButton.setHref(iconPath);
		}
	};

	/**
	 * @method showButtons
	 */
	ButtonGroup.prototype.showButtons = function () {
		this._log("showButtons", "Enter");
		var i,
			count,
			controls = null;
		if (this.isEventInfoAvailable) {
			// if event data is available then show all the available buttons.
			controls = [this._languageButton, this._languageString, this._subtitlesButton, this._subtitlesString, this._optionsButton, this._optionsString];
		} else {
			// if event data is not available then show all the available buttons except options button.
			controls = [this._languageButton, this._languageString, this._subtitlesButton, this._subtitlesString];
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

	ButtonGroup.prototype.showInfoAndOptionsIcons = function () {
		var ACTIVE = true;
		this.setInfoIcon(ACTIVE);
		this.setOptionsIcon(ACTIVE);
		this._infoButton.show();
		this._infoString.show();
		this._optionsButton.show();
		this._optionsString.show();
	};


	/**
	 * @method hideInfoAndOptionsIcons
	 * hides the info and options button.
	 */

	ButtonGroup.prototype.hideInfoAndOptionsIcons = function () {
		var INACTIVE = false;
		this.setInfoIcon(INACTIVE);
		this.setOptionsIcon(INACTIVE);
		this._infoButton.hide();
		this._infoString.hide();
		this._optionsButton.hide();
		this._optionsString.hide();
	};

	/**
	 * @method setInfoAndOptionsIcons
	 * @param {Boolean} hasEventData
	 */
	ButtonGroup.prototype.setInfoAndOptionsIcons = function (hasEventData) {
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
	ButtonGroup.prototype.setButtonPositionsAndVisibility = function (isDisplayedEventPlaying, hasEventData) {
		this._log("setButtonPositionsAndVisibility", "Enter");
		if (isDisplayedEventPlaying) {
			this.setInfoAndOptionsIcons(hasEventData);
			this._optionsButton.setX(this._OPTION_X);
			this._optionsString.setX(this._OPTION_X + this._optionsButton.getTrueWidth() + this._TEXT_OFFSET);

			this.showButtons();
		} else {
			this._languageButton.hide();
			this._languageString.hide();
			this._subtitlesButton.hide();
			this._subtitlesString.hide();
			this.setInfoAndOptionsIcons(hasEventData);
			this._optionsButton.setX(this._OPTION_NEXT_VIEW_X);
			this._optionsString.setX(this._OPTION_NEXT_VIEW_X + this._optionsButton.getTrueWidth() + this._TEXT_OFFSET);
		}
		this._log("setButtonPositionsAndVisibility", "Exit");
	};

	/**
	 * Returns a string representation of this class
	 *
	 * @method toString
	 * @return {String}
	 */
	ButtonGroup.prototype.toString = function () {
		return "ButtonGroup";
	};

	$N.gui.ButtonGroup = ButtonGroup;
}($N || window.parent.$N || {}));
