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
			this._PLATFORM = "OTV";
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
		 * The TV key
		 * @property {String} KEY_TV
		 * @readonly
		 */
		proto.KEY_TV = "tv";

		/**
		 * The TV key for keyup event
		 * @property {String} KEY_TV_REL
		 * @readonly
		 */
		proto.KEY_TV_REL = "tv_rel";

		/**
		 * The radio key.
		 * @property {String} KEY_RADIO
		 * @readonly
		 */
		proto.KEY_RADIO = "radio";

		/**
		 * The radio key for keyup event.
		 * @property {String} KEY_RADIO_REL
		 * @readonly
		 */
		proto.KEY_RADIO_REL = "radio_rel";

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
		 * The teletext key
		 * @property {String} KEY_TELETEXT
		 * @readonly
		 */
		proto.KEY_TELETEXT = "teletext";

		/**
		 * The teletext key for keyup event
		 * @property {String} KEY_TELETEXT_REL
		 * @readonly
		 */
		proto.KEY_TELETEXT_REL = "teletext_rel";

		/**
		 * The favourites key
		 * @property {String} KEY_FAVOURITES
		 * @readonly
		 */
		proto.KEY_FAVOURITES = "favourites";

		/**
		 * The favourites key for keyup event
		 * @property {String} KEY_FAVOURITES_REL
		 * @readonly
		 */
		proto.KEY_FAVOURITES_REL = "favourites_rel";

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
		 * The language key
		 * @property {String} KEY_LANG
		 * @readonly
		 */
		proto.KEY_LANG = "lang";

		/**
		 * The language key for keyup event.
		 * @property {String} KEY_LANG_REL
		 * @readonly
		 */
		proto.KEY_LANG_REL = "lang_rel";

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
		 * The jump key
		 * @property {String} KEY_JUMP
		 * @readonly
		 */
		proto.KEY_JUMP = "jump";

		/**
		 * The jump key for keyup event
		 * @property {String} KEY_JUMP_REL
		 * @readonly
		 */
		proto.KEY_JUMP_REL = "jump_rel";

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
		 * The sleep key
		 * @property {String} KEY_SLEEP
		 * @readonly
		 */
		proto.KEY_SLEEP = "sleep";

		/**
		 * The sleep key for keyup event
		 * @property {String} KEY_SLEEP_REL
		 * @readonly
		 */
		proto.KEY_SLEEP_REL = "sleep_rel";

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
		 * The page back key
		 * @property {String} KEY_PG_BACK
		 * @readonly
		 */
		proto.KEY_PG_BACK = "pgback";

		/**
		 * The page back key for keyup event
		 * @property {String} KEY_PG_BACK_REL
		 * @readonly
		 */
		proto.KEY_PG_BACK_REL = "pgback_rel";

		/**
		 * The page forward key
		 * @property {String} KEY_PG_FWD
		 * @readonly
		 */
		proto.KEY_PG_FWD = "pgfwd";

		/**
		 * The page forward key for keyup event
		 * @property {String} KEY_PG_FWD_REL
		 * @readonly
		 */
		proto.KEY_PG_FWD_REL = "pgfwd_rel";

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
		 * The picture format key
		 * @property {String} KEY_PICTURE_FORMAT
		 * @readonly
		 */
		proto.KEY_PICTURE_FORMAT = "picture_format";

		/**
		 * The picture format key for keyup event
		 * @property {String} KEY_PICTURE_FORMAT_REL
		 * @readonly
		 */
		proto.KEY_PICTURE_FORMAT_REL = "picture_format_rel";

		/**
		 * The next channel key
		 * @property {String} KEY_NEXT_CHANNEL
		 * @readonly
		 */
		proto.KEY_NEXT_CHANNEL = "next_channel";

		/**
		 * The next channel key for keyup event
		 * @property {String} KEY_NEXT_CHANNEL_REL
		 * @readonly
		 */
		proto.KEY_NEXT_CHANNEL_REL = "next_channel_rel";

		/**
		 * The previous channel key
		 * @property {String} KEY_PREVIOUS_CHANNEL
		 * @readonly
		 */
		proto.KEY_PREVIOUS_CHANNEL = "prev_channel";

		/**
		 * The previous channel key for keyup event
		 * @property {String} KEY_PREVIOUS_CHANNEL_REL
		 * @readonly
		 */
		proto.KEY_PREVIOUS_CHANNEL_REL = "prev_channel_rel";

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
		 * The AUX key
		 * @property {String} KEY_AUX
		 * @readonly
		 */
		proto.KEY_AUX = "aux";

		/**
		 * The AUX key for keyup event
		 * @property {String} KEY_AUX_REL
		 * @readonly
		 */
		proto.KEY_AUX_REL = "aux_rel";

		/**
		 * The content key
		 * @property {String} KEY_CONTENT
		 * @readonly
		 */
		proto.KEY_CONTENT = "content";

		/**
		 * The content key for keyup event
		 * @property {String} KEY_CONTENT_REL
		 * @readonly
		 */
		proto.KEY_CONTENT_REL = "content_rel";

		/**
		 * The games key
		 * @property {String} KEY_GAMES
		 * @readonly
		 */
		proto.KEY_GAMES = "games";

		/**
		 * The games key for keyup event
		 * @property {String} KEY_GAMES_REL
		 * @readonly
		 */
		proto.KEY_GAMES_REL = "games_rel";

		/**
		 * The delete key
		 * @property {String} KEY_DEL
		 * @readonly
		 */
		proto.KEY_DEL = "delete";

		/**
		 * The delete key for keyup event
		 * @property {String} KEY_DEL_REL
		 * @readonly
		 */
		proto.KEY_DEL_REL = "delete_rel";

		/**
		 * The channel flip key
		 * @property {String} KEY_CHAN_FLIP
		 * @readonly
		 */
		proto.KEY_CHAN_FLIP = "channel_flip";

		/**
		 * The channel flip key for keyup event
		 * @property {String} KEY_CHAN_FLIP_REL
		 * @readonly
		 */
		proto.KEY_CHAN_FLIP_REL = "channel_flip_rel";

		/**
		 * The TV VOD key
		 * @property {String} KEY_TV_VIDEO_ON_DEMAND
		 * @readonly
		 */
		proto.KEY_TV_VIDEO_ON_DEMAND = "video_on_demand";

		/**
		 * The TV VOD key for keyup event
		 * @property {String} KEY_TV_VIDEO_ON_DEMAND_REL
		 * @readonly
		 */
		proto.KEY_TV_VIDEO_ON_DEMAND_REL = "video_on_demand_rel";

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

		/**
		 * The VIEW key
		 * @property {String} KEY_VIEW
		 * @readonly
		 */
		proto.KEY_VIEW = "view";

		/**
		 * The VIEW key for keyup event
		 * @property {String} KEY_VIEW_REL
		 * @readonly
		 */
		proto.KEY_VIEW_REL = "view_rel";


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
			61538: proto.KEY_EXIT,
			0xe0112: proto.KEY_MOVIES,
			0x00043: proto.KEY_PVR,
			61455: proto.KEY_POWER,
			0x0004B: proto.KEY_SETTINGS,
			61472: proto.KEY_SUBTITLE,
			0xe0111: proto.KEY_GUIDE,
			0x0005A: proto.KEY_PICTURE_FORMAT,
			0x00055: proto.KEY_TV_ON_DEMAND,
			61451: proto.KEY_OK,
			61512: proto.KEY_BACK,
			8: proto.KEY_BACK, // Computer keyboard's Backspace key
			61458: proto.KEY_MENU,
			61467: proto.KEY_GUIDE,
			61492: proto.KEY_AUX,
			61516: proto.KEY_VOL_UP,
			61517: proto.KEY_VOL_DOWN,
			61510: proto.KEY_CHAN_UP,
			61511: proto.KEY_CHAN_DOWN,
			61526: proto.KEY_RECORD,
			61506: proto.KEY_RED,
			61507: proto.KEY_GREEN,
			61508: proto.KEY_YELLOW,
			61509: proto.KEY_BLUE,
			61522: proto.KEY_STOP,
			61520: proto.KEY_PLAY_PAUSE,
			61521: proto.KEY_PLAY,
			19: proto.KEY_PAUSE,
			61530: proto.KEY_FFW,
			61529: proto.KEY_REW,
			61532: proto.KEY_SKIP_FW,
			61531: proto.KEY_SKIP_REW,
			61466: proto.KEY_FAVOURITES,
			61490: proto.KEY_TELETEXT,
			61495: proto.KEY_AUDIO,
			62720: proto.KEY_VOD,
			62721: proto.KEY_SEARCH,
			62722: proto.KEY_VIEW,
			61460: proto.KEY_INFO,
			61518: proto.KEY_MUTE
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