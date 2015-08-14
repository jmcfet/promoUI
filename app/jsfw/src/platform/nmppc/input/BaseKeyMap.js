/**
* Base class for device / platform specific keymaps.
* A KeyMap is a mapping of a device-specific key code (represented by the key event.keyCode)
* to a defined key constant. All implemented keymaps will inherit a set of common key definitions
* and must override those specific to the platform. Additional Key definitions maybe added for specific platforms, however
* it is important to note that those keys will only be propagated on that platform.
* @class $N.platform.input.BaseKeyMap
* @author Mark Brown
*
* @constructor
*/

define('jsfw/platform/input/BaseKeyMap',
    [],
	function () {

		function BaseKeyMap() {
			this._PLATFORM = "HTML5";
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
		 * The enter key.
		 * @property {String} KEY_ENTER
		 * @readonly
		 */
		proto.KEY_ENTER = "enter";

		/**
		 * The enter key for keyup event.
		 * @property {String} KEY_ENTER_REL
		 * @readonly
		 */
		proto.KEY_ENTER_REL = "enter_rel";

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
		 * The refresh key.
		 * @property {String} KEY_REFRESH
		 * @readonly
		 */
		proto.KEY_REFRESH = "refresh";

		/**
		 * The refresh key for keyup event.
		 * @property {String} KEY_REFRESH_REL
		 * @readonly
		 */
		proto.KEY_REFRESH_REL = "refresh_rel";

		/**
		 * The home key.
		 * @property {String} KEY_HOME
		 * @readonly
		 */
		proto.KEY_HOME = "home";

		/**
		 * The home key for keyup event.
		 * @property {String} KEY_HOME_REL
		 * @readonly
		 */
		proto.KEY_HOME_REL = "home_rel";

		/**
		 * The escape key.
		 * @property {String} KEY_ESCAPE
		 * @readonly
		 */
		proto.KEY_ESCAPE = "escape";

		/**
		 * The escape key for keyup event.
		 * @property {String} KEY_ESCAPE_REL
		 * @readonly
		 */
		proto.KEY_ESCAPE_REL = "escape_rel";

		/**
		 * The page up key
		 * @property {String} KEY_PG_UP
		 * @readonly
		 */
		proto.KEY_PG_UP = "pgup";

		/**
		 * The page up key for keyup event
		 * @property {String} KEY_PG_UP_REL
		 * @readonly
		 */
		proto.KEY_PG_UP_REL = "pgup_rel";

		/**
		 * The page down key
		 * @property {String} KEY_PG_DOWN
		 * @readonly
		 */
		proto.KEY_PG_DOWN	= "pgdown";

		/**
		 * The page down key for keyup event
		 * @property {String} KEY_PG_DOWN_REL
		 * @readonly
		 */
		proto.KEY_PG_DOWN_REL	= "pgdown_rel";

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
		 * The subtitle key.
		 * @property {String} KEY_SUBTITLE
		 * @readonly
		 */
		proto.KEY_SUBTITLE = "subtitle";

		/**
		 * The subtitle key for keyup event.
		 * @property {String} KEY_SUBTITLE_REL
		 * @readonly
		 */
		proto.KEY_SUBTITLE_REL = "subtitle_rel";

		/**
		 * The play/pause key
		 * @property {String} KEY_PLAY_PAUSE
		 * @readonly
		 */
		proto.KEY_PLAY_PAUSE = "play/pause";

		/**
		 * The play/pause key for keyup event
		 * @property {String} KEY_PLAY_PAUSE_REL
		 * @readonly
		 */
		proto.KEY_PLAY_PAUSE_REL = "play/pause_rel";

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
		 * The skip forward key
		 * @property {String} KEY_SKIP_FW
		 * @readonly
		 */
		proto.KEY_SKIP_FW = "skipfw";

		/**
		 * The skip forward key for keyup event
		 * @property {String} KEY_SKIP_FW_REL
		 * @readonly
		 */
		proto.KEY_SKIP_FW_REL = "skipfw_rel";

		/**
		 * The skip backward key
		 * @property {String} KEY_SKIP_REW
		 * @readonly
		 */
		proto.KEY_SKIP_REW = "skiprew";

		/**
		 * The skip backward key for keyup event
		 * @property {String} KEY_SKIP_REW_REL
		 * @readonly
		 */
		proto.KEY_SKIP_REW_REL = "skiprew_rel";

		/**
		 * The REPEAT key
		 * @property {String} KEY_REPEAT
		 * @readonly
		 */
		proto.KEY_REPEAT = "repeat";

		/**
		 * The REPEAT key for keyup event
		 * @property {String} KEY_REPEAT_REL
		 * @readonly
		 */
		proto.KEY_REPEAT_REL = "repeat_rel";

		/**
		 * The audio key.
		 * @property {String} KEY_AUDIO
		 * @readonly
		 */
		proto.KEY_AUDIO = "audio";

		/**
		 * The audio key for keyup event.
		 * @property {String} KEY_AUDIO_REL
		 * @readonly
		 */
		proto.KEY_AUDIO_REL = "audio_rel";

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

		/**
		 * The VOD key
		 * @property {String} KEY_VOD
		 * @readonly
		 */
		proto.KEY_VOD = "vod";

		/**
		 * The VOD key for keyup event
		 * @property {String} KEY_VOD_REL
		 * @readonly
		 */
		proto.KEY_VOD_REL = "vod_rel";

		/**
		 * The SEARCH key
		 * @property {String} KEY_SEARCH
		 * @readonly
		 */
		proto.KEY_SEARCH = "search";

		/**
		 * The SEARCH key for keyup event
		 * @property {String} KEY_SEARCH_REL
		 * @readonly
		 */
		proto.KEY_SEARCH_REL = "search_rel";


		// Default mapping
		proto._KEYMAP = {
			0x00030: proto.KEY_ZERO,
			0x00031: proto.KEY_ONE,
			0x00032: proto.KEY_TWO,
			0x00033: proto.KEY_THREE,
			0x00034: proto.KEY_FOUR,
			0x00035: proto.KEY_FIVE,
			0x00036: proto.KEY_SIX,
			0x00037: proto.KEY_SEVEN,
			0x00038: proto.KEY_EIGHT,
			0x00039: proto.KEY_NINE,
			0x00025: proto.KEY_LEFT,
			0x00026: proto.KEY_UP,
			0x00027: proto.KEY_RIGHT,
			0x00028: proto.KEY_DOWN,
			//0x0000D: proto.KEY_ENTER,
			0x0000D: proto.KEY_OK,
			0x00074: proto.KEY_REFRESH,
			0x00024: proto.KEY_HOME,
			0x00008: proto.KEY_BACK, // Computer keyboard's Backspace key
			0x00021: proto.KEY_PG_UP,
			0x00022: proto.KEY_PG_DOWN
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
		* key code 37 returns KEY_LEFT.
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

