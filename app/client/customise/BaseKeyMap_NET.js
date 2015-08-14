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

(function ($N) {

	function BaseKeyMap() {
		this._PLATFORM = "OTV";
		this._PLATFORM_VARIANT = "";
	}

	var proto = BaseKeyMap.prototype;

	// Default Key Constants

	/**
	 * The zero key.
	 * @property {String} KEY_ZERO
	 */
	proto.KEY_ZERO = "0";

	/**
	 * The one key.
	 * @property {String} KEY_ONE
	 */
	proto.KEY_ONE = "1";

	/**
	 * The two key.
	 * @property {String} KEY_TWO
	 */
	proto.KEY_TWO = "2";

	/**
	 * The three key.
	 * @property {String} KEY_THREE
	 */
	proto.KEY_THREE = "3";

	/**
	 * The four key.
	 * @property {String} KEY_FOUR
	 */
	proto.KEY_FOUR = "4";

	/**
	 * The five key.
	 * @property {String} KEY_FIVE
	 */
	proto.KEY_FIVE = "5";

	/**
	 * The six key.
	 * @property {String} KEY_SIX
	 */
	proto.KEY_SIX = "6";

	/**
	 * The seven key.
	 * @property {String} KEY_SEVEN
	 */
	proto.KEY_SEVEN = "7";

	/**
	 * The eight key.
	 * @property {String} KEY_EIGHT
	 */
	proto.KEY_EIGHT = "8";

	/**
	 * The nine key.
	 * @property {String} KEY_NINE
	 */
	proto.KEY_NINE = "9";

	/**
	 * The up key.
	 * @property {String} KEY_UP
	 */
	proto.KEY_UP = "up";

	/**
	 * The down key.
	 * @property {String} KEY_DOWN
	 */
	proto.KEY_DOWN = "down";

	/**
	 * The left key.
	 * @property {String} KEY_LEFT
	 */
	proto.KEY_LEFT = "left";

	/**
	 * The right key.
	 * @property {String} KEY_RIGHT
	 */
	proto.KEY_RIGHT = "right";

	/**
	 * The OK key.
	 * @property {String} KEY_OK
	 */
	proto.KEY_OK = "ok";

	/**
	 * The enter key.
	 * @property {String} KEY_ENTER
	 */
	proto.KEY_ENTER = "enter";

	/**
	 * The back key.
	 * @property {String} KEY_BACK
	 */
	proto.KEY_BACK = "back";

	/**
	 * The forward key.
	 * @property {String} KEY_FORWARD
	 */
	proto.KEY_FORWARD = "forward";

	/**
	 * The refresh key.
	 * @property {String} KEY_REFRESH
	 */
	proto.KEY_REFRESH = "refresh";

	/**
	 * The menu key.
	 * @property {String} KEY_MENU
	 */
	proto.KEY_MENU = "menu";

	/**
	 * The portal key.
	 * @property {String} KEY_PORTAL
	 */
	proto.KEY_PORTAL = "portal";

	/**
	 * The TV key.
	 * @property {String} KEY_TV
	 */
	proto.KEY_TV = "tv";

	/**
	 * The radio key.
	 * @property {String} KEY_RADIO
	 */
	proto.KEY_RADIO = "radio";

	/**
	 * The exit key.
	 * @property {String} KEY_EXIT
	 */
	proto.KEY_EXIT = "exit";

	/**
	 * The home key.
	 * @property {String} KEY_HOME
	 */
	proto.KEY_HOME = "home";

	/**
	 * The info key.
	 * @property {String} KEY_INFO
	 */
	proto.KEY_INFO = "info";

	/**
	 * The escape key.
	 * @property {String} KEY_ESCAPE
	 */
	proto.KEY_ESCAPE = "escape";

	/**
	 * The guide key.
	 * @property {String} KEY_GUIDE
	 */
	proto.KEY_GUIDE = "guide";

	/**
	 * The subtitle key.
	 * @property {String} KEY_SUBTITLE
	 */
	proto.KEY_SUBTITLE = "subtitle";

	/**
	 * The teletext key.
	 * @property {String} KEY_TELETEXT
	 */
	proto.KEY_TELETEXT = "teletext";

	/**
	 * The favourites key.
	 * @property {String} KEY_FAVOURITES
	 */
	proto.KEY_FAVOURITES = "favourites";

	/**
	 * The audio key.
	 * @property {String} KEY_AUDIO
	 */
	proto.KEY_AUDIO = "audio";

	/**
	 * The language key
	 * @property {String} KEY_LANG
	 */
	proto.KEY_LANG = "lang";

	/**
	 * The play/pause key
	 * @property {String} KEY_PLAY_PAUSE
	 */
	proto.KEY_PLAY_PAUSE = "play/pause";

	/**
	 * The play key
	 * @property {String} KEY_PLAY
	 */
	proto.KEY_PLAY = "play";

	/**
	 * The pause key
	 * @property {String} KEY_PAUSE
	 */
	proto.KEY_PAUSE = "pause";

	/**
	 * The stop key
	 * @property {String} KEY_STOP
	 */
	proto.KEY_STOP = "stop";

	/**
	 * The record key
	 * @property {String} KEY_RECORD
	 */
	proto.KEY_RECORD = "record";

	/**
	 * The jump key
	 * @property {String} KEY_JUMP
	 */
	proto.KEY_JUMP = "jump";

	/**
	 * The rewind key
	 * @property {String} KEY_REW
	 */
	proto.KEY_REW = "rw";

	/**
	 * The fast-forward key
	 * @property {String} KEY_FFW
	 */
	proto.KEY_FFW = "ff";

	/**
	 * The skip forward key
	 * @property {String} KEY_SKIP_FW
	 */
	proto.KEY_SKIP_FW = "skipfw";

	/**
	 * The skip backward key
	 * @property {String} KEY_SKIP_REW
	 */
	proto.KEY_SKIP_REW = "skiprew";

	/**
	 * The channel up key
	 * @property {String} KEY_CHAN_UP
	 */
	proto.KEY_CHAN_UP = "chup";

	/**
	 * The channel down key
	 * @property {String} KEY_CHAN_DOWN
	 */
	proto.KEY_CHAN_DOWN = "chdown";

	/**
	 * The volume down key
	 * @property {String} KEY_VOL_DOWN
	 */
	proto.KEY_VOL_DOWN = "voldown";

	/**
	 * The volume up key
	 * @property {String} KEY_VOL_UP
	 */
	proto.KEY_VOL_UP = "volup";

	/**
	 * The mute key
	 * @property {String} KEY_MUTE
	 */
	proto.KEY_MUTE = "mute";

	/**
	 * The replay key
	 * @property {String} KEY_REPLAY
	 */
	proto.KEY_REPLAY = "replay";

	/**
	 * The red key
	 * @property {String} KEY_RED
	 */
	proto.KEY_RED = "red";

	/**
	 * The green key
	 * @property {String} KEY_GREEN
	 */
	proto.KEY_GREEN = "green";

	/**
	 * The yellow key
	 * @property {String} KEY_YELLOW
	 */
	proto.KEY_YELLOW = "yellow";

	/**
	 * The blue key
	 * @property {String} KEY_BLUE
	 */
	proto.KEY_BLUE = "blue";

	/**
	 * The sleep key
	 * @property {String} KEY_SLEEP
	 */
	proto.KEY_SLEEP = "sleep";

	/**
	 * The power key
	 * @property {String} KEY_POWER
	 */
	proto.KEY_POWER = "power";

	/**
	 * The page up key
	 * @property {String} KEY_PG_UP
	 */
	proto.KEY_PG_UP = "pgup";

	/**
	 * The page back key
	 * @property {String} KEY_PG_BACK
	 */
	proto.KEY_PG_BACK = "pgback";

	/**
	 * The page forward key
	 * @property {String} KEY_PG_FWD
	 */
	proto.KEY_PG_FWD = "pgfwd";

	/**
	 * The page down key
	 * @property {String} KEY_PG_DOWN
	 */
	proto.KEY_PG_DOWN	= "pgdown";

	/**
	 * The picture format key
	 * @property {String} KEY_PICTURE_FORMAT
	 */
	proto.KEY_PICTURE_FORMAT = "picture_format";

	/**
	 * The next channel key
	 * @property {String} KEY_NEXT_CHANNEL
	 */
	proto.KEY_NEXT_CHANNEL = "next_channel";

	/**
	 * The previous channel key
	 * @property {String} KEY_PREVIOUS_CHANNEL
	 */
	proto.KEY_PREVIOUS_CHANNEL = "prev_channel";

	/**
	 * The settings key
	 * @property {String} KEY_SETTINGS
	 */
	proto.KEY_SETTINGS = "settings";

	/**
	 * The VOD key
	 * @property {String} KEY_VOD
	 */
	proto.KEY_VOD = "vod";

	/**
	 * The AUX key
	 * @property {String} KEY_AUX
	 */
	proto.KEY_AUX = "aux";

	/**
	 * The content key
	 * @property {String} KEY_CONTENT
	 */
	proto.KEY_CONTENT = "content";

	/**
	 * The games key
	 * @property {String} KEY_GAMES
	 */
	proto.KEY_GAMES = "games";

	/**
	 * The delete key
	 * @property {String} KEY_DEL
	 */
	proto.KEY_DEL = "delete";

	/**
	 * The channel flip key
	 * @property {String} KEY_CHAN_FLIP
	 */
	proto.KEY_CHAN_FLIP = "channel_flip";

	/**
	 * The TV VOD key
	 * @property {String} KEY_TV_VIDEO_ON_DEMAND
	 */
	proto.KEY_TV_VIDEO_ON_DEMAND = "video_on_demand";

	/**
	 * The SEARCH key
	 * @property {String} KEY_SEARCH
	 */
	proto.KEY_SEARCH = "search";

	/**
	 * The VIEW key
	 * @property {String} KEY_VIEW
	 */
	proto.KEY_VIEW = "view";

	/**
	 * The AGORA key
	 * @property {String} KEY_AGORA
	 */
	proto.KEY_AGORA = "agora";

	/**
	 * The MOSAIC key
	 * @property {String} KEY_MOSAIC
	 */
	proto.KEY_MOSAIC = "mosaic";

	/**
	 * The PPV key
	 * @property {String} KEY_PPV
	 */
	proto.KEY_PPV = "ppv";

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
		0x00026: proto.KEY_UP,
		0x00028: proto.KEY_DOWN,
		0x00025: proto.KEY_LEFT,
		0x00027: proto.KEY_RIGHT,
		61479 : proto.KEY_TV,
		61487 : proto.KEY_RADIO,
		0x00024: proto.KEY_HOME,
		601: proto.KEY_EXIT,
		0xe0112: proto.KEY_MOVIES,
		0x00043: proto.KEY_PVR,
		409: proto.KEY_POWER,
		0x0004B: proto.KEY_SETTINGS,
		61472: proto.KEY_SUBTITLE,
		0xe0111: proto.KEY_GUIDE,
		0x0005A: proto.KEY_PICTURE_FORMAT,
		0x00055: proto.KEY_TV_ON_DEMAND,
		13: proto.KEY_OK,
		166: proto.KEY_BACK,
		8: proto.KEY_BACK, // Computer keyboard's Backspace key
		93: proto.KEY_MENU,
		0xdb245e87: proto.KEY_PORTAL,
		458: proto.KEY_GUIDE,
		61492: proto.KEY_AUX,
		175: proto.KEY_VOL_UP,
		174: proto.KEY_VOL_DOWN,
		427: proto.KEY_CHAN_UP,
		428: proto.KEY_CHAN_DOWN,
		416: proto.KEY_RECORD,
		403: proto.KEY_RED,
		404: proto.KEY_GREEN,
		405: proto.KEY_YELLOW,
		406: proto.KEY_BLUE,
		178: proto.KEY_STOP,
		179: proto.KEY_PLAY_PAUSE,
		250: proto.KEY_PLAY,
		19: proto.KEY_PAUSE,
		417: proto.KEY_FFW,
		412: proto.KEY_REW,
		176: proto.KEY_SKIP_FW,
		177: proto.KEY_SKIP_REW,
		171: proto.KEY_FAVOURITES,
		61490: proto.KEY_TELETEXT,
		61495: proto.KEY_AUDIO,
		62720: proto.KEY_PPV,
		62721: proto.KEY_SEARCH,
		62722: proto.KEY_VOD,
		457: proto.KEY_INFO,
		61501: proto.KEY_AGORA,
		62724: proto.KEY_MOSAIC,
		173: proto.KEY_MUTE,
		61523: proto.KEY_REPLAY
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

	$N.platform = $N.platform || {};
	$N.platform.input = $N.platform.input || {};
	$N.platform.input.BaseKeyMap = BaseKeyMap;

}($N || {}));
