/**
 * This class provides an interface for changing the styling of closed captions.
 * It allows for the following changes:
 * Font color, font opacity, font face, font size, character edge attributes,
 * character edge color, background color, background opacity, window color, window opacity
 *
 * @class $N.platform.output.ClosedCaption
 * @singleton
 *
 * @author Gareth Stacey
 */
/*global ccSettingsAgent*/
define('jsfw/platform/output/ClosedCaption',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};

		$N.platform.output.ClosedCaption = (function () {
			return {

				/**
				 * Returns the fonts supported by the current system
				 * @method getSystemFonts
				 * @return {Array} Array of font string names for the given style which is one of FONT_STYLE enumerations
				 */
				getSystemFontsForStyle: function (style) {
					if (ccSettingsAgent) {
						return ccSettingsAgent.getSystemFonts(style);
					}
				},

				/**
				 * Sets the color of the closed caption font
				 * @method setFontColor
				 * @param {Number} color One of the COLOR enumerations
				 */
				setFontColor: function (color) {
					if (ccSettingsAgent) {
						ccSettingsAgent.characterColor = color;
					}
				},

				/**
				 * Returns the color of the closed caption font
				 * @method GetFontColor
				 * @return {Number} One of the COLOR enumerations
				 */
				getFontColor: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.characterColor;
					}
				},

				/**
				 * Sets the opacity of the closed caption font
				 * @method setFontOpacity
				 * @param {Number} opacity One of the OPACITY enumerations
				 */
				setFontOpacity: function (opacity) {
					if (ccSettingsAgent) {
						ccSettingsAgent.characterOpacity = opacity;
					}
				},

				/**
				 * Returns the opacity of the closed caption font
				 * @method getFontOpacity
				 * @return {Number} One of the OPACITY enumerations
				 */
				getFontOpacity: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.characterOpacity;
					}
				},

				/**
				 * Sets the style of the closed caption font
				 * @method setFontStyle
				 * @param {Array} fonts An array of objects containing name and style properties where the style is one of
				 * FONT_STYLE enumerations and name is the name of the font (e.g. Courier)
				 */
				setFontStyles: function (fonts) {
					if (ccSettingsAgent) {
						ccSettingsAgent.fonts = fonts;
					}
				},

				/**
				 * Returns the font style of the closed caption font
				 * @method getFontStyles
				 * @return {Array} Contains seven items, one for each FONT_STYLE.
				 */
				getFontStyles: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.fonts;
					}
				},

				/**
				 * Sets the size of the closed caption font
				 * @method setFontSize
				 * @param {Number} size
				 */
				setFontSize: function (size) {
					if (ccSettingsAgent) {
						ccSettingsAgent.characterSize = size;
					}
				},

				/**
				 * Returns the size of the closed caption font
				 * @method getFontSize
				 * @return {Number} size
				 */
				getFontSize: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.characterSize;
					}
				},

				/**
				 * Sets the attribute of the closed caption font edge
				 * @method setCharacterEdgeAttribute
				 * @param {Number} attribute One of the EDGE_ATTRIBUTE enumerations
				 */
				setCharacterEdgeAttribute: function (attribute) {
					if (ccSettingsAgent) {
						ccSettingsAgent.characterEdgeAttributes = attribute;
					}
				},

				/**
				 * Returns the attribute of the closed caption font edge
				 * @method getCharacterEdgeAttribute
				 * @return {Number} One of the EDGE_ATTRIBUTE enumerations
				 */
				getCharacterEdgeAttribute: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.characterEdgeAttributes;
					}
				},

				/**
				 * Sets the color of the closed caption font edge
				 * @method setCharacterEdgeColor
				 * @param {Number} color One of the COLOR enumerations
				 */
				setCharacterEdgeColor: function (color) {
					if (ccSettingsAgent) {
						ccSettingsAgent.characterEdgeColor = color;
					}
				},

				/**
				 * Returns the color of the closed caption font edge
				 * @method getCharacterEdgeColor
				 * @return {Number} One of the COLOR enumerations
				 */
				getCharacterEdgeColor: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.characterEdgeColor;
					}
				},

				/**
				 * Sets the color of the closed caption background
				 * @method setBackgroundColor
				 * @param {Number} color One of the COLOR enumerations
				 */
				setBackgroundColor: function (color) {
					if (ccSettingsAgent) {
						ccSettingsAgent.captionBackgroundColor = color;
					}
				},

				/**
				 * Gets the color of the closed caption background
				 * @method getBackgroundColor
				 * @return {Number} One of the COLOR enumerations
				 */
				getBackgroundColor: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.captionBackgroundColor;
					}
				},

				/**
				 * Sets the opacity of the closed caption background
				 * @method setBackgroundOpacity
				 * @param {Number} opacity One of the OPACITY enumerations
				 */
				setBackgroundOpacity: function (opacity) {
					if (ccSettingsAgent) {
						ccSettingsAgent.captionBackgroundOpacity = opacity;
					}
				},

				/**
				 * Returns the opacity of the closed caption background
				 * @method getBackgroundOpacity
				 * @return {Number} One of the OPACITY enumerations
				 */
				getBackgroundOpacity: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.captionBackgroundOpacity;
					}
				},

				/**
				 * Sets the color of the closed caption window
				 * @method setWindowColor
				 * @param {Number} color One of the COLOR enumerations
				 */
				setWindowColor: function (color) {
					if (ccSettingsAgent) {
						ccSettingsAgent.captionWindowColor = color;
					}
				},

				/**
				 * Returns the color of the closed caption window
				 * @method getWindowColor
				 * @return {Number} One of the COLOR enumerations
				 */
				getWindowColor: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.captionWindowColor;
					}
				},

				/**
				 * Sets the opacity of the closed caption window
				 * @method setWindowOpacity
				 * @param {Number} opacity One of the OPACITY enumerations
				 */
				setWindowOpacity: function (opacity) {
					if (ccSettingsAgent) {
						ccSettingsAgent.captionWindowOpacity = opacity;
					}
				},

				/**
				 * Returns the opacity of the closed caption window
				 * @method getWindowOpacity
				 * @return {Number} One of the OPACITY enumerations
				 */
				getWindowOpacity: function () {
					if (ccSettingsAgent) {
						return ccSettingsAgent.captionWindowOpacity;
					}
				},

				/**
				 * Specifies the colors that can be used to set things
				 * such as font color, background color, window color
				 * @property {Enum} COLOR
				 * @readonly
				 * @static
				 */
				COLOR: {
					DEFAULT: -1,
					WHITE: 0,
					BLACK: 1,
					RED: 2,
					GREEN: 3,
					BLUE: 4,
					YELLOW: 5,
					MAGENTA: 6,
					CYAN: 7
				},

				/**
				 * Specifies the opacities that can be used to set things
				 * such as font opacity, background opacity, window opacity
				 * @property {Enum} OPACITY
				 * @readonly
				 * @static
				 */
				OPACITY: {
					DEFAULT: -1,
					OPAQUE: 100,
					SEMI_75: 75,
					SEMI_25: 25,
					TRANSPARENT: 0
				},

				/**
				 * Specifies the font styles that can be used to set the
				 * font face
				 * @property {Enum} FONT_STYLE
				 * @readonly
				 * @static
				 */
				FONT_STYLE: {
					DEFAULT: 0,
					MONOSPACED_SERIFS: 1,
					SERIFS: 2,
					MONOSPACED_SANS_SERIFS: 3,
					SANS_SERIFS: 4,
					CASUAL: 5,
					CURSIVE: 6,
					SMALL_CAPITALS: 7
				},

				/**
				 * Specifies the edge attributes that can be used to set the
				 * font edge styling
				 * @property {Enum} EDGE_ATTRIBUTE
				 * @readonly
				 * @static
				 */
				EDGE_ATTRIBUTE: {
					DEFAULT: -1,
					NONE: 0,
					RAISED: 1,
					DEPRESSED: 2,
					UNIFORM: 3,
					DROP_SHADOWED: 4
				}

			};
		}());
		return $N.platform.output.ClosedCaption;
	}
);