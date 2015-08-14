/**
 * Defines the keys for use with keyboard when developing in HTML mode on Chrome
 * @class $N.platform.input.KeyMap_HtmlDev
 * @extends $N.platform.input.BaseKeyMap
 * @requires $N.platform.input.BaseKeyMap
 * @author pnewcombe
 *
 * @constructor
 */

(function ($N) {
	"use strict";
	var CCOM = document.getElementById("CCOMid"),
		isEmulator = (typeof CCOM !== "function");
	function KeyMap_HtmlDev() {
		if (isEmulator) {
			this._PLATFORM = "KeyMap_HtmlDev";
			this._PLATFORM_VARIANT = "";

			// Overrides the default key mapping
			this._KEYMAP[27] = this.KEY_EXIT; // ESC

			this._KEYMAP[112] = this.KEY_HOME; // F1
			this._KEYMAP[113] = this.KEY_GUIDE; // F2
			this._KEYMAP[114] = this.KEY_VIEW; // F3
			this._KEYMAP[115] = this.KEY_MENU; // F4

			this._KEYMAP[116] = this.KEY_RED; // F5
			this._KEYMAP[117] = this.KEY_GREEN; // F6
			this._KEYMAP[118] = this.KEY_YELLOW; // F7
			this._KEYMAP[119] = this.KEY_BLUE; // F8
			this._KEYMAP[120] = this.KEY_HOME; // F9
			this._KEYMAP[121] = this.KEY_POWER; // F10
			this._KEYMAP[122] = this.KEY_PPV; // F11

			this._KEYMAP[189] = this.KEY_CHAN_DOWN; // -
			this._KEYMAP[187] = this.KEY_CHAN_UP; // +

			this._KEYMAP[8] = this.KEY_BACK; // backspace
			this._KEYMAP[13] = this.KEY_OK; // enter
			this._KEYMAP[16] = this.KEY_INFO; // shift

			this._KEYMAP[45] = this.KEY_REW; // insert
			this._KEYMAP[36] = this.KEY_PLAY_PAUSE; // home
			this._KEYMAP[33] = this.KEY_FFW; // pg-up
			this._KEYMAP[46] = this.KEY_SKIP_REW; // delete
			this._KEYMAP[35] = this.KEY_STOP; // end
			this._KEYMAP[34] = this.KEY_SKIP_FW; // pg-down

			this._KEYMAP[82] = this.KEY_RECORD; // R

			this._KEYMAP[67] = this.KEY_VOL_DOWN; // C
			this._KEYMAP[86] = this.KEY_VOL_UP; // V
			this._KEYMAP[66] = this.KEY_MUTE; // B

			this._KEYMAP[83] = this.KEY_SUBTITLE; // S
			this._KEYMAP[84] = this.KEY_AGORA; // Map T key for Agora
			this._KEYMAP[77] = this.KEY_RADIO; // Map M key for Radio/Music
			this._KEYMAP[70] = this.KEY_FAVOURITES; // F
			this._KEYMAP[87] = this.KEY_MOSAIC; // Map W key for Mosaic
		}
	}

	if (isEmulator) {
		KeyMap_HtmlDev.prototype = new $N.platform.input.BaseKeyMap();

		$N.platform = $N.platform || {};
		$N.platform.input = $N.platform.input || {};
		$N.platform.input.KeyMap_HtmlDev = KeyMap_HtmlDev;
	}
}($N || {}));