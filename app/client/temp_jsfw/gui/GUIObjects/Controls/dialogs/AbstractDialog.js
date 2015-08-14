/**
 * The super class for the GUI framework dialogs, offers the basic
 * properties and functionality of all dialogs including
 * a title, message and ok callback.  Method like setWidth can
 * be overridden to handle more specific behaviour in the
 * concrete subclasses.
 * @class $N.gui.AbstractDialog
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.TextArea
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @author mbrown
 * @constructor
 * @param docRef {Object} - the document property of the page
 */

define('jsfw/gui/GUIObjects/Controls/dialogs/AbstractDialog',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/Components/TextArea',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (GUIObject, Container, Image, Label, TextArea, Util, FrameworkCore) {

		function AbstractDialog(docRef) {
			AbstractDialog.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(docRef);
			this._background = new $N.gui.Image(docRef, this._container);
			this._title = new $N.gui.Label(docRef, this._container);
			this._message = new $N.gui.TextArea(docRef, this._container);

			this._container.configure({
				cssClass: "dialog_bg",
				rounding: AbstractDialog.DEFAULT_ROUNDING
			});

			this._title.configure({
				x: AbstractDialog.DEFAULT_TITLE_POS.x,
				y: AbstractDialog.DEFAULT_TITLE_POS.y,
				cssClass: "dialog_title"
			});

			this._message.configure({
				x: AbstractDialog.DEFAULT_MESSAGE_POS.x,
				y: AbstractDialog.DEFAULT_MESSAGE_POS.y,
				cssClass: "dialog_message"
			});

			this._rootElement = this._container.getRootElement();

			this._okCallback = null;

			this.setHeight(AbstractDialog.DEFAULT_HEIGHT);
			this.setWidth(AbstractDialog.DEFAULT_WIDTH);
			this.setPosition(AbstractDialog.DEFAULT_X, AbstractDialog.DEFAULT_Y);
		}

		$N.gui.Util.extend(AbstractDialog, $N.gui.GUIObject);

		/**
		 * The height that new dialogs will be if setHeight is not called
		 * @property {Number} DEFAULT_HEIGHT
		 * @readonly 200
		 */
		AbstractDialog.DEFAULT_HEIGHT = 200;

		/**
		 * The width that new dialogs will be if setWidth is not called
		 * @property {Number} DEFAULT_WIDTH
		 * @readonly 400
		 */
		AbstractDialog.DEFAULT_WIDTH = 400;

		/**
		 * The x position that new dialogs will be drawn at if setX is not called
		 * @property {Number} DEFAULT_X
		 * @readonly 200
		 */
		AbstractDialog.DEFAULT_X = 200;

		/**
		 * The y position that new dialogs will be drawn at if setX is not called
		 * @property {Number} DEFAULT_Y
		 * @readonly 200
		 */
		AbstractDialog.DEFAULT_Y = 200;

		/**
		 * The default rounding that should be used to draw the dialog container
		 * @property {Number} DEFAULT_ROUNDING
		 * @readonly 0
		 */
		AbstractDialog.DEFAULT_ROUNDING = 0;

		/**
		 * A coordinate object with x and y properties representing the default
		 * position of the title
		 * @property {Object} DEFAULT_TITLE_POS
		 * @readonly {x:10, y:30}
		 */
		AbstractDialog.DEFAULT_TITLE_POS = {x: 10, y: 30};

		/**
		 * A coordinate object with x and y properties representing the default
		 * postion of the message
		 * @property {Object} DEFAULT_MESSAGE_POS
		 * @readonly {x:10, y:70}
		 */
		AbstractDialog.DEFAULT_MESSAGE_POS = {x: 10, y: 70};

		var proto = AbstractDialog.prototype;

		/**
		 * Sets the width of the dialog given the width in pixels
		 * @method setWidth
		 * @param {Object} width
		 */
		proto.setWidth = function (width) {
			this._container.setWidth(width);
			this._message.setWidth(width - 20);
			this._title.setWidth(width);
		};

		/**
		 * Returns the width of the dialog in pixels
		 * @method getWidth
		 * @return {Number}
		 */
		proto.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Sets the height of the dialog given the height in pixels
		 * @method setHeight
		 * @param {Object} height
		 */
		proto.setHeight = function (height) {
			this._container.setHeight(height);
			this._message.setHeight(height - this._message.getY());
		};

		/**
		 * Returns the height of the Dialog in pixels
		 * @method getHeight
		 * @return {Number}
		 */
		proto.getHeight = function () {
			return this._container.getHeight();
		};

		/**
		 * Sets the title of the dialog
		 * @method setTitle
		 * @param {String} text
		 */
		proto.setTitle = function (text) {
			this._title.setText(text);
		};

		/**
		 * Returns the title of the dialog
		 * @method getTitle
		 * @return {String}
		 */
		proto.getTitle = function () {
			return this._title.getText();
		};

		/**
		 * Sets the the message to be displayed in the dialog
		 * @method setMessage
		 * @param {String} text
		 */
		proto.setMessage = function (text) {
			this._message.setText(text);
		};

		/**
		 * Returns the message being displayed in the dialog
		 * @method getMessage
		 * @return {String}
		 */
		proto.getMessage = function () {
			this._message.getText();
		};

		/**
		 * Sets the function that should be executed when the
		 * dialog has received an ok key press i.e. it's dismissed.
		 * @method setOkCallback
		 * @param {Function} callback
		 */
		proto.setOkCallback = function (callback) {
			this._okCallback = callback;
		};

		/**
		 * Default keyHandler that executes the ok  callback if the ok
		 * key is pressed. The class creating the dialog should pass the
		 * keys on to this function
		 * @method keyHandler
		 * @param {String} key string representation of the pressed key
		 * @return {Boolean} True if key was handled, false otherwise.
		 */
		proto.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			if (key === keys.KEY_OK && this._okCallback) {
				this._okCallback();
				return true;
			}
			return false;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AbstractDialog = AbstractDialog;
		return AbstractDialog;
    }
);