/**
 * GeneralItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * Your datamapper should expose the following accessors:
 *
 *     {
 *         {String} getTitle({Object})
 *         {String} getIcon({Object})
 *     }
 *
 * For example:
 *
 *     var dataMapper = {
 *         getTitle: function(item) {
 *             return item.title;
 *         },
 *         getIcon: function(item) {
 *             return item.imageHref;
 *         }
 *     };
 *
 * @class $N.gui.GeneralItem
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Layer
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractListItem
 *
 * @constructor
 * @param {Object} docRef (DOM document)
 */
define('jsfw/gui/GUIObjects/Controls/List/customisable/GeneralItem',
    [
    'jsfw/gui/GUIObjects/Components/Layer',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractListItem'
    ],
    function (Layer, Image, Label, Util, AbstractListItem) {

		var GeneralItem = function (docRef) {

			GeneralItem.superConstructor.call(this, docRef);

			this._container = new $N.gui.Layer(docRef);
			this._container.setWidth(300);
			this._container.setHeight(40);
			this._image = new $N.gui.Image(docRef, this._container);
			this._text = new $N.gui.Label(docRef, this._container);

			this._text.configure({
				x: 30,
				y: 27,
				width: 115,
				cssClass: "generalItemText"
			});

			this._image.configure({
				x: 0,
				y: 10,
				width: 32,
				height: 28,
				quality: 1
			});

			this._rootElement = this._container.getRootElement();
			this._rootElement.appendChild(this._moveAnim.getRootElement()); //from AbstractListItem
			this._rootElement.appendChild(this._fadeAnim.getRootElement()); //from AbstractListItem
		};

		$N.gui.Util.extend(GeneralItem, $N.gui.AbstractListItem);

		/**
		 * Sets the width of the GeneralItem.
		 *
		 * @method setWidth
		 *
		 * @param {Number} width The width of the GeneralItem.
		 *
		 * @return {Object} The GeneralItem object.
		 */
		GeneralItem.prototype.setWidth = function (width) {
			this._width = width;
			this._text.setWidth(width - 40);
			return this;
		};

		/**
		 * Sets the height of the GeneralItem.
		 *
		 * @method setHeight
		 *
		 * @param {Number} height The height of the GeneralItem.
		 *
		 * @return {Object} The GeneralItem object.
		 */
		GeneralItem.prototype.setHeight = function (height) {
			this._height = height;
			return this;
		};

		/**
		 * Highlights the GeneralItem.
		 *
		 * @method highlight
		 */
		GeneralItem.prototype.highlight = function () {
		};

		/**
		 * Removes the highlight from the GeneralItem.
		 *
		 * @method unHighlight
		 */
		GeneralItem.prototype.unHighlight = function () {
		};

		/**
		 * Updates the data stored within the GeneralItem.
		 *
		 * @method update
		 *
		 * @param {Object} data Object containing the new data.
		 */
		GeneralItem.prototype.update = function (data) {
			if (data) {
				this._text.setText(this._dataMapper.getTitle(data));
				this._image.setHref(this._dataMapper.getIcon(data));
			}
		};

		/**
		 * Sets the CSS class that will style the text.
		 *
		 * @method setTextClass
		 *
		 * @param {String} cssClassName The name of the CSS class to be used.
		 */
		GeneralItem.prototype.setTextClass = function (cssClassName) {
			this._text.setCssClass(cssClassName);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.GeneralItem = GeneralItem;
		return GeneralItem;
	}
);