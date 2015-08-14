/**
 * Helper class for keyboard
 * This manages the keypad object with
 * generic  function calls.
 * @class $N.app.KeyboardUtils
 * @author raj
 * @static
 */
(function ($N) {
	$N.app = $N.app || {};

	$N.app.KeyboardType = {
		NUMERIC: "numeric",
		ALPHA_NUMERIC_UPPERCASE: "alphaNumericUpperCase",
		ALPHA_NUMERIC_LOWERCASE: "alphaNumericLowerCase"
	};

	$N.app.KeyboardType.ALIGNMENT = {
		LEFT: "left",
		CENTRE: "centre"
	};

	$N.app.KeyboardUtils = (function () {

		var keypad = null,
			_saveCallback = function () {},
			_keypadReturnObject = null;

		/**
		 * Returns the common grid appearance
		 * for the keys of the keypad based on type
		 * @method getKeyGridConfig
		 * @param {String} the type of the keypad
		 */
		function getKeyGridConfig(type) {
			var configObj = {
				"numeric" : {
					"height" : 1,
					"width" : 1
				},
				"alphaNumericUpperCase" : {
					"height" : 1,
					"width" : 1
				},
				"alphaNumericLowerCase" : {
					"height" : 1,
					"width" : 1
				}
			};
			return configObj[type];
		}

		/**
		 * Returns the template level appearance config
		 * for the keys of the keypad based on type
		 * @method getKeyConfig
		 * @param {String} the type of the keypad
		 */
		function getKeyConfig(type) {
			var configObj = {
				"numeric" : {
					"cssClass" : "keyInactive"
				},
				"alphaNumericUpperCase" : {
					"textY" : 0,
					"cssClass" : "keyInactive"
				},
				"alphaNumericLowerCase" : {
					"textY" : 0,
					"cssClass" : "keyInactive"
				}
			};
			return configObj[type];
		}

		/**
		 * Attaches the grid config data to the
		 * key objects which are common if they were
		 * not having them individually
		 * @method formatKeyData
		 * @param {Object,Object} keys data and the common grid config
		 */
		function formatKeyData(keyData, keyGridConfig) {
			var i = null;
			for (i = 0; i < keyData.items.length; i++) {
				keyData.items[i].height = keyData.items[i].height || keyGridConfig.height;
				keyData.items[i].width = keyData.items[i].width || keyGridConfig.width;
				keyData.items[i].cssClass = keyData.items[i].cssClass || keyGridConfig.cssClass;
				keyData.items[i].keyPressCallback = keyData.items[i].keyPressCallback || keyGridConfig.keyPressCallback;
			}
			return keyData;
		}

		/**
		 * Retrieves the data for the keys
		 * based on the the type of the keypad
		 * @method getKeysData
		 * @param {string} type of the keypad
		 */
		function getKeysData(type) {
			var dataObj = {
				"numeric" : {
					"gridSize": {
						"width" : 3,
						"height" : 4
					},
					"defaultHighlightCellIndex" : $N.app.KeyboardUtils.NUM_SAVE_KEY_INDEX,
					"items": [
						{
							"x": 0,
							"y": 0,
							"data": {
								"text": "1"
							}
						},
						{
							"x": 1,
							"y": 0,
							"data": {
								"text": "2"
							}
						},
						{
							"x": 2,
							"y": 0,
							"data": {
								"text": "3"
							}
						},
						{
							"x": 0,
							"y": 1,
							"data": {
								"text": "4"
							}
						},
						{
							"x": 1,
							"y": 1,
							"data": {
								"text": "5"
							}
						},
						{
							"x": 2,
							"y": 1,
							"data": {
								"text": "6"
							}
						},
						{
							"x": 0,
							"y": 2,
							"data": {
								"text": "7"
							}
						},
						{
							"x": 1,
							"y": 2,
							"data": {
								"text": "8"
							}
						},
						{
							"x": 2,
							"y": 2,
							"data": {
								"text": "9"
							}
						},
						{
							"x": 0,
							"y": 3,
							"data": {
								"text": $N.app.KeyboardUtils.getString("keypadSaveButton"),
								"id" : "save",
								"labelCssClass": "greyKeypadKey",
								"textY": "18"
							},
							"keyPressCallback" : _saveCallback,
							"keypadReturnObject" : _keypadReturnObject
						},
						{
							"x": 1,
							"y": 3,
							"data": {
								"text": "0"
							}
						},
						{
							"x": 2,
							"y": 3,
							"data": {
								"image": "../../../customise/resources/images/%RES/icons/del.png",
								"imageTop": -10,
								"imageLeft": 0,
								"highlightCssClass": "keyActive",
								"id" : "delete"
							},
							"template": "Key"
						}
					]
				},
				"alphaNumericUpperCase" : {
					"gridSize": {
						"width" : 8,
						"height" : 5
					},
					"items": [
						{
							"x": 0,
							"y": 0,
							"data": {
								"text": "A"
							}
						},
						{
							"x": 1,
							"y": 0,
							"data": {
								"text": "B"
							}
						},
						{
							"x": 2,
							"y": 0,
							"data": {
								"text": "C"
							}
						},
						{
							"x": 3,
							"y": 0,
							"data": {
								"text": "D"
							}
						},
						{
							"x": 4,
							"y": 0,
							"data": {
								"text": "E"
							}
						},
						{
							"x": 5,
							"y": 0,
							"data": {
								"text": "F"
							}
						},
						{
							"x": 6,
							"y": 0,
							"data": {
								"text": "G"
							}
						},
						{
							"x": 7,
							"y": 0,
							"data": {
								"text": "H"
							}
						},
						{
							"x": 0,
							"y": 1,
							"data": {
								"text": "I"
							}
						},
						{
							"x": 1,
							"y": 1,
							"data": {
								"text": "J"
							}
						},
						{
							"x": 2,
							"y": 1,
							"data": {
								"text": "K"
							}
						},
						{
							"x": 3,
							"y": 1,
							"data": {
								"text": "L"
							}
						},
						{
							"x": 4,
							"y": 1,
							"data": {
								"text": "M"
							}
						},
						{
							"x": 5,
							"y": 1,
							"data": {
								"text": "N"
							}
						},
						{
							"x": 6,
							"y": 1,
							"data": {
								"text": "O"
							}
						},
						{
							"x": 7,
							"y": 1,
							"data": {
								"text": "P"
							}
						},
						{
							"x": 0,
							"y": 2,
							"data": {
								"text": "Q"
							}
						},
						{
							"x": 1,
							"y": 2,
							"data": {
								"text": "R"
							}
						},
						{
							"x": 2,
							"y": 2,
							"data": {
								"text": "S"
							}
						},
						{
							"x": 3,
							"y": 2,
							"data": {
								"text": "T"
							}
						},
						{
							"x": 4,
							"y": 2,
							"data": {
								"text": "U"
							}
						},
						{
							"x": 5,
							"y": 2,
							"data": {
								"text": "V"
							}
						},
						{
							"x": 6,
							"y": 2,
							"data": {
								"text": "W"
							}
						},
						{
							"x": 7,
							"y": 2,
							"data": {
								"text": "X"
							}
						},
						{
							"x": 0,
							"y": 3,
							"data": {
								"text": "Y"
							}
						},
						{
							"x": 1,
							"y": 3,
							"data": {
								"text": "Z"
							}
						},
						{
							"x": 2,
							"y": 3,
							"data": {
								"text": "1"
							}
						},
						{
							"x": 3,
							"y": 3,
							"data": {
								"text": "2"
							}
						},
						{
							"x": 4,
							"y": 3,
							"data": {
								"text": "3"
							}
						},
						{
							"x": 5,
							"y": 3,
							"data": {
								"text": "4"
							}
						},
						{
							"x": 6,
							"y": 3,
							"data": {
								"text": "5"
							}
						},
						{
							"x": 7,
							"y": 3,
							"data": {
								"text": "6"
							}
						},
						{
							"x": 0,
							"y": 4,
							"data": {
								"text": "7"
							}
						},
						{
							"x": 1,
							"y": 4,
							"data": {
								"text": "8"
							}
						},
						{
							"x": 2,
							"y": 4,
							"data": {
								"text": "9"
							}
						},
						{
							"x": 3,
							"y": 4,
							"data": {
								"text": "0"
							}
						},
						{
							"x": 4,
							"y": 4,
							"data": {
								"image": "../../../customise/resources/images/%RES/icons/space_bar.png",
								"imageTop": 7.5,
								"imageLeft": 34.5,
								"highlightCssClass": "keyActive",
								"rounding": 2,
								"id" : "space"
							},
							"template": "Key",
							"itemConfig" : {
								"cssClass" : "keyInactive"
							},
							"width": 2
						},
						{
							"x": 6,
							"y": 4,
							"data": {
								"image": "../../../customise/resources/images/%RES/icons/del_for_AlphaNumericKeypad.png",
								"imageTop": 6,
								"imageLeft": 36,
								"highlightCssClass": "keyActive",
								"rounding": 2,
								"id" : "delete"
							},
							"template": "Key",
							"itemConfig" : {
								"cssClass" : "keyInactive"
							},
							"width": 2
						}
					]
				},
				"alphaNumericLowerCase" : {
					"gridSize": {
						"width" : 8,
						"height" : 5
					},
					"items": [
						{
							"x": 0,
							"y": 0,
							"data": {
								"text": "a"
							}
						},
						{
							"x": 1,
							"y": 0,
							"data": {
								"text": "b"
							}
						},
						{
							"x": 2,
							"y": 0,
							"data": {
								"text": "c"
							}
						},
						{
							"x": 3,
							"y": 0,
							"data": {
								"text": "d"
							}
						},
						{
							"x": 4,
							"y": 0,
							"data": {
								"text": "e"
							}
						},
						{
							"x": 5,
							"y": 0,
							"data": {
								"text": "f"
							}
						},
						{
							"x": 6,
							"y": 0,
							"data": {
								"text": "g"
							}
						},
						{
							"x": 7,
							"y": 0,
							"data": {
								"text": "h"
							}
						},
						{
							"x": 0,
							"y": 1,
							"data": {
								"text": "i"
							}
						},
						{
							"x": 1,
							"y": 1,
							"data": {
								"text": "j"
							}
						},
						{
							"x": 2,
							"y": 1,
							"data": {
								"text": "k"
							}
						},
						{
							"x": 3,
							"y": 1,
							"data": {
								"text": "l"
							}
						},
						{
							"x": 4,
							"y": 1,
							"data": {
								"text": "m"
							}
						},
						{
							"x": 5,
							"y": 1,
							"data": {
								"text": "n"
							}
						},
						{
							"x": 6,
							"y": 1,
							"data": {
								"text": "o"
							}
						},
						{
							"x": 7,
							"y": 1,
							"data": {
								"text": "p"
							}
						},
						{
							"x": 0,
							"y": 2,
							"data": {
								"text": "q"
							}
						},
						{
							"x": 1,
							"y": 2,
							"data": {
								"text": "r"
							}
						},
						{
							"x": 2,
							"y": 2,
							"data": {
								"text": "s"
							}
						},
						{
							"x": 3,
							"y": 2,
							"data": {
								"text": "t"
							}
						},
						{
							"x": 4,
							"y": 2,
							"data": {
								"text": "u"
							}
						},
						{
							"x": 5,
							"y": 2,
							"data": {
								"text": "v"
							}
						},
						{
							"x": 6,
							"y": 2,
							"data": {
								"text": "w"
							}
						},
						{
							"x": 7,
							"y": 2,
							"data": {
								"text": "x"
							}
						},
						{
							"x": 0,
							"y": 3,
							"data": {
								"text": "y"
							}
						},
						{
							"x": 1,
							"y": 3,
							"data": {
								"text": "z"
							}
						},
						{
							"x": 2,
							"y": 3,
							"data": {
								"text": "1"
							}
						},
						{
							"x": 3,
							"y": 3,
							"data": {
								"text": "2"
							}
						},
						{
							"x": 4,
							"y": 3,
							"data": {
								"text": "3"
							}
						},
						{
							"x": 5,
							"y": 3,
							"data": {
								"text": "4"
							}
						},
						{
							"x": 6,
							"y": 3,
							"data": {
								"text": "5"
							}
						},
						{
							"x": 7,
							"y": 3,
							"data": {
								"text": "6"
							}
						},
						{
							"x": 0,
							"y": 4,
							"data": {
								"text": "7"
							}
						},
						{
							"x": 1,
							"y": 4,
							"data": {
								"text": "8"
							}
						},
						{
							"x": 2,
							"y": 4,
							"data": {
								"text": "9"
							}
						},
						{
							"x": 3,
							"y": 4,
							"data": {
								"text": "0"
							}
						},
						{
							"x": 4,
							"y": 4,
							"data": {
								"image": "../../../customise/resources/images/%RES/icons/space_bar.png",
								"imageTop": 7.5,
								"imageLeft": 34.5,
								"highlightCssClass": "keyActive",
								"rounding": 2,
								"id" : "space"
							},
							"template": "Key",
							"itemConfig" : {
								"cssClass" : "keyInactive"
							},
							"width": 2
						},
						{
							"x": 6,
							"y": 4,
							"data": {
								"image": "../../../customise/resources/images/%RES/icons/del_for_AlphaNumericKeypad.png",
								"imageTop": 6,
								"imageLeft": 36,
								"highlightCssClass": "keyActive",
								"rounding": 2,
								"id" : "delete"
							},
							"template": "Key",
							"itemConfig" : {
								"cssClass" : "keyInactive"
							},
							"width": 2
						}
					]
				}
			};
			return dataObj[type];
		}

		function showKeypad(type) {
			var keyData = getKeysData(type),
				keyConfig = getKeyConfig(type),
				keyGridConfig = getKeyGridConfig(type);
			keyData = formatKeyData(keyData, keyGridConfig);
			keypad.setKeyConfig(keyConfig);
			keypad.clearKeys();
			keypad.setKeys(keyData);
		}

		function setKeypad(keypadObject, keypadType) {
			keypad = keypadObject;
			keypad.initialise(keypadType);
		}

		function getKeypad() {
			return keypad;
		}

		/**
		 * Sets the callback that will be fired on
		 * press of save button
		 * @method setSaveCallback
		 * @param {function} save callback function
		 */
		function setSaveCallback(callback) {
			_saveCallback = callback;
		}

		/**
		 * Setter to set the format of the
		 * object that will be returned on save
		 * @method setKeypadReturnObject
		 * @param {object} save return object
		 */
		function setKeypadReturnObject(object) {
			_keypadReturnObject = object;
		}

		return {
			setSaveCallback : setSaveCallback,
			setKeypadReturnObject : setKeypadReturnObject,
			showKeypad : showKeypad,
			setKeypad : setKeypad,
			getKeypad : getKeypad,
			NUM_SAVE_KEY_INDEX : 9
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.KeyboardUtils);

}($N || {}));
