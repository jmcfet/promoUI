/**
 * Defines the platform specific keymap for the AndroidTV platform
 * @class $N.platform.input.KeyMap_AndroidTV
 * @extends $N.platform.input.BaseKeyMap
 * @requires $N.platform.input.BaseKeyMap
 * @author sdermott
 *
 * @constructor
 */

define('jsfw/platform/input/KeyMap_AndroidTV',
    [
    'jsfw/platform/input/BaseKeyMap'
    ],
	function (BaseKeyMap) {

		function KeyMap_AndroidTV() {
			this._PLATFORM = "AndroidTV";
			this._PLATFORM_VARIANT = "";

			// Overrides the default key mapping
			this._KEYMAP = {};
			this._KEYMAP[0x00030] = this.KEY_ZERO;
			this._KEYMAP[0x00031] = this.KEY_ONE;
			this._KEYMAP[0x00032] = this.KEY_TWO;
			this._KEYMAP[0x00033] = this.KEY_THREE;
			this._KEYMAP[0x00034] = this.KEY_FOUR;
			this._KEYMAP[0x00035] = this.KEY_FIVE;
			this._KEYMAP[0x00036] = this.KEY_SIX;
			this._KEYMAP[0x00037] = this.KEY_SEVEN;
			this._KEYMAP[0x00038] = this.KEY_EIGHT;
			this._KEYMAP[0x00039] = this.KEY_NINE;
			this._KEYMAP[13] = this.KEY_OK;
			this._KEYMAP[20019] = this.KEY_UP;
			this._KEYMAP[20020] = this.KEY_DOWN;
			this._KEYMAP[20021] = this.KEY_LEFT;
			this._KEYMAP[20022] = this.KEY_RIGHT;
			this._KEYMAP[20082] = this.KEY_MENU;
			this._KEYMAP[2004] = this.KEY_BACK;
			this._KEYMAP[20089] = this.KEY_HOME;
			this._KEYMAP[20084] = this.KEY_SEARCH;
			this._KEYMAP[20085] = this.KEY_PLAY_PAUSE;
			this._KEYMAP[20086] = this.KEY_STOP;
			this._KEYMAP[20089] = this.KEY_REW;
			this._KEYMAP[20090] = this.KEY_FFW;
			this._KEYMAP[20087] = this.KEY_SKIP_FW;
			this._KEYMAP[20088] = this.KEY_SKIP_REW;
			this._KEYMAP[10007] = this.KEY_REPEAT;
			this._KEYMAP[10003] = this.KEY_AUDIO;
			this._KEYMAP[10002] = this.KEY_SUBTITLE;
		}

		KeyMap_AndroidTV.prototype = new $N.platform.input.BaseKeyMap();

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.input = $N.platform.input || {};
		$N.platform.input.KeyMap_AndroidTV = KeyMap_AndroidTV;
		return KeyMap_AndroidTV;
	}
);