/**
 * Defines the platform specific keymap for the OpenTV emulator platform
 * @class $N.platform.input.KeyMap_NET
 * @extends $N.platform.input.BaseKeyMap
 * @requires $N.platform.input.BaseKeyMap
 * @author gstacey
 *
 * @constructor
 */

(function ($N) {

	function KeyMap_NET() {
		this._PLATFORM = "KeyMapNET";
		this._PLATFORM_VARIANT = "";

		// Overrides the default key mapping
		this._KEYMAP[917556] = this.KEY_INFO;
		this._KEYMAP[0xe0035] = this.KEY_POWER;
		this._KEYMAP[93] = this.KEY_MENU;
		this._KEYMAP[0xdb245e87] = this.KEY_PORTAL;
		this._KEYMAP[113] = this.KEY_GUIDE;
		this._KEYMAP[917786] = this.KEY_FAVOURITES;
		this._KEYMAP[61523] = this.KEY_REPLAY;
		this._KEYMAP[13] = this.KEY_OK;
		this._KEYMAP[84] = this.KEY_AGORA;  //T
		this._KEYMAP[87] = this.KEY_MOSAIC;  //W
		this._KEYMAP[81] = this.KEY_ENTER; // Q
		this._KEYMAP[69] = this.KEY_BACK; // E
		this._KEYMAP[82] = this.KEY_EXIT; // R
		this._KEYMAP[89] = this.KEY_HOME; // Y
		this._KEYMAP[85] = this.KEY_INFO; // U
		this._KEYMAP[73] = this.KEY_ESCAPE; // I
		this._KEYMAP[79] = this.KEY_GUIDE; // O
		this._KEYMAP[80] = this.KEY_PLAY; // P
		this._KEYMAP[65] = this.KEY_PAUSE; // A
		this._KEYMAP[83] = this.KEY_STOP; // S
		this._KEYMAP[68] = this.KEY_RECORD; // D
		this._KEYMAP[70] = this.KEY_REW; // F
		this._KEYMAP[71] = this.KEY_FFW; // G
		this._KEYMAP[72] = this.KEY_SKIP_FW; // H
		this._KEYMAP[74] = this.KEY_SKIP_REW; // J
		this._KEYMAP[76] = this.KEY_CHAN_UP; // L
		this._KEYMAP[88] = this.KEY_CHAN_DOWN; // X
		this._KEYMAP[67] = this.KEY_VOL_DOWN; // C
		this._KEYMAP[86] = this.KEY_VOL_UP; // V
		this._KEYMAP[66] = this.KEY_MUTE; // B
		this._KEYMAP[78] = this.KEY_RED; // N
		this._KEYMAP[77] = this.KEY_GREEN; // M
		this._KEYMAP[44] = this.KEY_YELLOW; // ,
		this._KEYMAP[46] = this.KEY_BLUE; // .
		this._KEYMAP[8] = this.KEY_DEL; // del

	}

	KeyMap_NET.prototype = new $N.platform.input.BaseKeyMap();

	$N.platform = $N.platform || {};
	$N.platform.input = $N.platform.input || {};
	$N.platform.input.KeyMap_NET = KeyMap_NET;

}($N || {}));
