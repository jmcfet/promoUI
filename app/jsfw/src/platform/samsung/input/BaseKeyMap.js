/**
* Base class for device / platform specific keymaps.
* A KeyMap is a mapping of a device-specific key code (represented by the key event.keyCode)
* to a defined key constant. All implemented keymaps will inherit a set of common key definitions
* and must override those specific to the platform. Additional Key definitions maybe added for specific platforms, however
* it is important to note that those keys will only be propagated on that platform.
* @class $N.platform.input.BaseKeyMap
* @author Gareth Stacey
*
* @constructor
*/


define('jsfw/platform/input/BaseKeyMap',
    [],
	function () {

		function BaseKeyMap() {
			this._PLATFORM = "SAMSUNG";
			this._PLATFORM_VARIANT = "";
		}

		var proto = BaseKeyMap.prototype;

		// Default Key Constants

		/**
		 * The zero key.
		 * @property {String} KEY_ZERO
		 * @readonly
		 */
		proto.KEY_ZERO = "0";

		/**
		 * The zero key for keyup event.
		 * @property {String} KEY_ZERO_REL
		 * @readonly
		 */
		proto.KEY_ZERO_REL = "0_rel";

		/**
		 * The one key.
		 * @property {String} KEY_ONE
		 * @readonly
		 */
		proto.KEY_ONE = "1";

		/**
		 * The one key for keyup event.
		 * @property {String} KEY_ONE_REL
		 * @readonly
		 */
		proto.KEY_ONE_REL = "1_rel";

		/**
		 * The two key.
		 * @property {String} KEY_TWO
		 * @readonly
		 */
		proto.KEY_TWO = "2";

		/**
		 * The two key for keyup event.
		 * @property {String} KEY_TWO_REL
		 * @readonly
		 */
		proto.KEY_TWO_REL = "2_rel";

		/**
		 * The three key.
		 * @property {String} KEY_THREE
		 * @readonly
		 */
		proto.KEY_THREE = "3";

		/**
		 * The three key for keyup event.
		 * @property {String} KEY_THREE_REL
		 * @readonly
		 */
		proto.KEY_THREE_REL = "3_rel";

		/**
		 * The four key.
		 * @property {String} KEY_FOUR
		 * @readonly
		 */
		proto.KEY_FOUR = "4";

		/**
		 * The four key for keyup event.
		 * @property {String} KEY_FOUR_REL
		 * @readonly
		 */
		proto.KEY_FOUR_REL = "4_rel";

		/**
		 * The five key.
		 * @property {String} KEY_FIVE
		 * @readonly
		 */
		proto.KEY_FIVE = "5";

		/**
		 * The five key for keyup event.
		 * @property {String} KEY_FIVE_REL
		 * @readonly
		 */
		proto.KEY_FIVE_REL = "5_rel";

		/**
		 * The six key.
		 * @property {String} KEY_SIX
		 * @readonly
		 */
		proto.KEY_SIX = "6";

		/**
		 * The six key for keyup event.
		 * @property {String} KEY_SIX_REL
		 * @readonly
		 */
		proto.KEY_SIX_REL = "6_rel";

		/**
		 * The seven key.
		 * @property {String} KEY_SEVEN
		 * @readonly
		 */
		proto.KEY_SEVEN = "7";

		/**
		 * The seven key for keyup event.
		 * @property {String} KEY_SEVEN_REL
		 * @readonly
		 */
		proto.KEY_SEVEN_REL = "7_rel";

		/**
		 * The eight key.
		 * @property {String} KEY_EIGHT
		 * @readonly
		 */
		proto.KEY_EIGHT = "8";

		/**
		 * The eight key for keyup event.
		 * @property {String} KEY_EIGHT_REL
		 * @readonly
		 */
		proto.KEY_EIGHT_REL = "8_rel";

		/**
		 * The nine key.
		 * @property {String} KEY_NINE
		 * @readonly
		 */
		proto.KEY_NINE = "9";

		/**
		 * The nine key for keyup event.
		 * @property {String} KEY_NINE_REL
		 * @readonly
		 */
		proto.KEY_NINE_REL = "9_rel";

		/**
		 * The up key.
		 * @property {String} KEY_UP
		 * @readonly
		 */
		proto.KEY_UP = "up";

		/**
		 * The up key for keyup event.
		 * @property {String} KEY_UP
		 * @readonly
		 */
		proto.KEY_UP_REL = "up_rel";

		/**
		 * The down key.
		 * @property {String} KEY_DOWN
		 * @readonly
		 */
		proto.KEY_DOWN = "down";

		/**
		 * The down key for keyup event.
		 * @property {String} KEY_DOWN_REL
		 * @readonly
		 */
		proto.KEY_DOWN_REL = "down_rel";

		/**
		 * The left key.
		 * @property {String} KEY_LEFT
		 * @readonly
		 */
		proto.KEY_LEFT = "left";

		/**
		 * The left key for keyup event.
		 * @property {String} KEY_LEFT_REL
		 * @readonly
		 */
		proto.KEY_LEFT_REL = "left_rel";

		/**
		 * The right key.
		 * @property {String} KEY_RIGHT
		 * @readonly
		 */
		proto.KEY_RIGHT = "right";

		/**
		 * The right key for keyup event.
		 * @property {String} KEY_RIGHT_REL
		 * @readonly
		 */
		proto.KEY_RIGHT_REL = "right_rel";

		/**
		 * The OK key.
		 * @property {String} KEY_OK
		 * @readonly
		 */
		proto.KEY_OK = "ok";

		/**
		 * The OK key for keyup event.
		 * @property {String} KEY_OK_REL
		 * @readonly
		 */
		proto.KEY_OK_REL = "ok_rel";

		/**
		 * The back key.
		 * @property {String} KEY_BACK
		 * @readonly
		 */
		proto.KEY_BACK = "back";

		/**
		 * The back key for keyup event.
		 * @property {String} KEY_BACK_REL
		 * @readonly
		 */
		proto.KEY_BACK_REL = "back_rel";

		/**
		 * The forward key
		 * @property {String} KEY_FORWARD
		 * @readonly
		 */
		proto.KEY_FORWARD = "forward";

		/**
		 * The forward key for keyup event.
		 * @property {String} KEY_FORWARD_REL
		 * @readonly
		 */
		proto.KEY_FORWARD_REL = "forward_rel";

		/**
		 * The menu key
		 * @property {String} KEY_MENU
		 * @readonly
		 */
		proto.KEY_MENU = "menu";

		/**
		 * The menu key for keyup event
		 * @property {String} KEY_MENU_REL
		 * @readonly
		 */
		proto.KEY_MENU_REL = "menu_rel";

		/**
		 * The exit key
		 * @property {String} KEY_EXIT
		 * @readonly
		 */
		proto.KEY_EXIT = "exit";

		/**
		 * The exit key for keyup event
		 * @property {String} KEY_EXIT_REL
		 * @readonly
		 */
		proto.KEY_EXIT_REL = "exit_rel";

		/**
		 * The info key
		 * @property {String} KEY_INFO
		 * @readonly
		 */
		proto.KEY_INFO = "info";

		/**
		 * The info key for keyup event
		 * @property {String} KEY_INFO_REL
		 * @readonly
		 */
		proto.KEY_INFO_REL = "info_rel";

		/**
		 * The guide key
		 * @property {String} KEY_GUIDE
		 * @readonly
		 */
		proto.KEY_GUIDE = "guide";

		/**
		 * The guide key for keyup event
		 * @property {String} KEY_GUIDE_REL
		 * @readonly
		 */
		proto.KEY_GUIDE_REL = "guide_rel";

		/**
		 * The play key
		 * @property {String} KEY_PLAY
		 * @readonly
		 */
		proto.KEY_PLAY = "play";

		/**
		 * The play key for keyup event
		 * @property {String} KEY_PLAY_REL
		 * @readonly
		 */
		proto.KEY_PLAY_REL = "play_rel";

		/**
		 * The pause key
		 * @property {String} KEY_PAUSE
		 * @readonly
		 */
		proto.KEY_PAUSE = "pause";

		/**
		 * The pause key for keyup event
		 * @property {String} KEY_PAUSE_REL
		 * @readonly
		 */
		proto.KEY_PAUSE_REL = "pause_rel";

		/**
		 * The stop key
		 * @property {String} KEY_STOP
		 * @readonly
		 */
		proto.KEY_STOP = "stop";

		/**
		 * The stop key for keyup event
		 * @property {String} KEY_STOP_REL
		 * @readonly
		 */
		proto.KEY_STOP_REL = "stop_rel";

		/**
		 * The record key
		 * @property {String} KEY_RECORD
		 * @readonly
		 */
		proto.KEY_RECORD = "record";

		/**
		 * The record key for keyup event
		 * @property {String} KEY_RECORD_REL
		 * @readonly
		 */
		proto.KEY_RECORD_REL = "record_rel";

		/**
		 * The rewind key
		 * @property {String} KEY_REW
		 * @readonly
		 */
		proto.KEY_REW = "rw";

		/**
		 * The rewind key for keyup event
		 * @property {String} KEY_REW_REL
		 * @readonly
		 */
		proto.KEY_REW_REL = "rw_rel";

		/**
		 * The fast-forward key
		 * @property {String} KEY_FFW
		 * @readonly
		 */
		proto.KEY_FFW = "ff";

		/**
		 * The fast-forward key for keyup event
		 * @property {String} KEY_FFW_REL
		 * @readonly
		 */
		proto.KEY_FFW_REL = "ff_rel";

		/**
		 * The channel up key
		 * @property {String} KEY_CHAN_UP
		 * @readonly
		 */
		proto.KEY_CHAN_UP = "chup";

		/**
		 * The channel up key for keyup event
		 * @property {String} KEY_CHAN_UP_REL
		 * @readonly
		 */
		proto.KEY_CHAN_UP_REL = "chup_rel";

		/**
		 * The channel down key
		 * @property {String} KEY_CHAN_DOWN
		 * @readonly
		 */
		proto.KEY_CHAN_DOWN = "chdown";

		/**
		 * The channel down key for keyup event
		 * @property {String} KEY_CHAN_DOWN_REL
		 * @readonly
		 */
		proto.KEY_CHAN_DOWN_REL = "chdown_rel";

		/**
		 * The volume down key
		 * @property {String} KEY_VOL_DOWN
		 * @readonly
		 */
		proto.KEY_VOL_DOWN = "voldown";

		/**
		 * The volume down key for keyup event
		 * @property {String} KEY_VOL_DOWN_REL
		 * @readonly
		 */
		proto.KEY_VOL_DOWN_REL = "voldown_rel";

		/**
		 * The volume up key
		 * @property {String} KEY_VOL_UP
		 * @readonly
		 */
		proto.KEY_VOL_UP = "volup";

		/**
		 * The volume up key for keyup event
		 * @property {String} KEY_VOL_UP_REL
		 * @readonly
		 */
		proto.KEY_VOL_UP_REL = "volup_rel";

		/**
		 * The mute key
		 * @property {String} KEY_MUTE
		 * @readonly
		 */
		proto.KEY_MUTE = "mute";

		/**
		 * The mute key for keyup event
		 * @property {String} KEY_MUTE_REL
		 * @readonly
		 */
		proto.KEY_MUTE_REL = "mute_rel";

		/**
		 * The red key
		 * @property {String} KEY_RED
		 * @readonly
		 */
		proto.KEY_RED = "red";

		/**
		 * The red key for keyup event
		 * @property {String} KEY_RED_REL
		 * @readonly
		 */
		proto.KEY_RED_REL = "red_rel";

		/**
		 * The green key
		 * @property {String} KEY_GREEN
		 * @readonly
		 */
		proto.KEY_GREEN = "green";

		/**
		 * The green key for keyup event
		 * @property {String} KEY_GREEN_REL
		 * @readonly
		 */
		proto.KEY_GREEN_REL = "green_rel";

		/**
		 * The yellow key
		 * @property {String} KEY_YELLOW
		 * @readonly
		 */
		proto.KEY_YELLOW = "yellow";

		/**
		 * The yellow key for keyup event
		 * @property {String} KEY_YELLOW_REL
		 * @readonly
		 */
		proto.KEY_YELLOW_REL = "yellow_rel";

		/**
		 * The blue key
		 * @property {String} KEY_BLUE
		 * @readonly
		 */
		proto.KEY_BLUE = "blue";

		/**
		 * The blue key for keyup event
		 * @property {String} KEY_BLUE_REL
		 * @readonly
		 */
		proto.KEY_BLUE_REL = "blue_rel";

		/**
		 * The power key
		 * @property {String} KEY_POWER
		 * @readonly
		 */
		proto.KEY_POWER = "power";

		/**
		 * The power key for keyup event
		 * @property {String} KEY_POWER_REL
		 * @readonly
		 */
		proto.KEY_POWER_REL = "power_rel";

		/**
		 * The settings key
		 * @property {String} KEY_SETTINGS
		 * @readonly
		 */
		proto.KEY_SETTINGS = "settings";

		/**
		 * The settings key for keyup event
		 * @property {String} KEY_SETTINGS_REL
		 * @readonly
		 */
		proto.KEY_SETTINGS_REL = "settings_rel";

		// Default mapping
		proto._KEYMAP = {
			17: proto.KEY_ZERO,
			101: proto.KEY_ONE,
			98: proto.KEY_TWO,
			6: proto.KEY_THREE,
			8: proto.KEY_FOUR,
			9: proto.KEY_FIVE,
			10: proto.KEY_SIX,
			12: proto.KEY_SEVEN,
			13: proto.KEY_EIGHT,
			14: proto.KEY_NINE,
			4: proto.KEY_LEFT,
			29460: proto.KEY_UP,
			5: proto.KEY_RIGHT,
			29461: proto.KEY_DOWN,
			29443: proto.KEY_OK,
			88: proto.KEY_BACK,
			76: proto.KEY_POWER,
		    71: proto.KEY_PLAY,
			72: proto.KEY_FFW,
			69: proto.KEY_REW,
			70: proto.KEY_STOP,
			74: proto.KEY_PAUSE,
			45: proto.KEY_EXIT,
			262: proto.KEY_MENU,
			84: proto.KEY_GUIDE,
			73: proto.KEY_RECORD,
			31: proto.KEY_INFO,
			11: proto.KEY_VOL_DOWN,
		    7: proto.KEY_VOL_UP,
		    27: proto.KEY_MUTE,
		    68: proto.KEY_CHAN_UP,
		    65: proto.KEY_CHAN_DOWN,
		    108: proto.KEY_RED,
		    20: proto.KEY_GREEN,
		    21: proto.KEY_YELLOW,
		    22: proto.KEY_BLUE,
		    75: proto.KEY_SETTINGS
		};

		/**
		* Returns the name of the platform this keymap represents
		* @method getPlatform
		* @return {String} Platform identifier
		*/
		proto.getPlatform = function () {
			return this._PLATFORM;
		};

		/**
		 * Returns the variant of the platform the keymap represents
		 * @method getPlatformVariant
		 * @return {String} Platform variant identifier
		 */
		proto.getPlatformVariant = function () {
			return this._PLATFORM_VARIANT;
		};

		/**
		* Returns the actual key constant for the key code. For example,
		* key code 37 returns `KEY_LEFT`.
		* @method getKey
		* @param {String} key The key code of the key to retrieve.
		* @return {String} Key Constant derived from the key code
		*/
		proto.getKey = function (key) {
			return this._KEYMAP[key];
		};

		/**
		 * Returns the key map object containing the mappings
		 * between key codes and keys
		 * @method getKeyMap
		 * @return {Object} keymap object
		 */
		proto.getKeyMap = function () {
			return this._KEYMAP;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.input = $N.platform.input || {};
		$N.platform.input.BaseKeyMap = BaseKeyMap;
		return BaseKeyMap;
	}
);
