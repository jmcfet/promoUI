/**
 * TextItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a text element.
 *
 * Your datamapper should expose the following accessors:
 *
 * {String} getText({Object})
 *
 * For example;
 *
 *     var dataMapper = {
 *         getText: function(item) {
 *             return item.title;
 *         }
 *     }
 *
 * @class $N.gui.TextItem
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.AbstractListItem
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef (DOM document)
 */
define('jsfw/gui/GUIObjects/Controls/List/customisable/TextItem',
    [
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractListItem'
    ],
    function (Group, Label, Util, AbstractListItem) {
		var TextItem = function (docRef) {

			TextItem.superConstructor.call(this, docRef);

			this._container = new $N.gui.Group(this._docRef);
			this._container.setWidth(140);
			this._container.setHeight(40);
			this._text = new $N.gui.Label(this._docRef, this._container);

			this._text.configure({
				x: 3,
				y: 30,
				cssClass: "textItemText"
			});

			this.setDataMapper({
				getText: function (obj) {
					return obj.name;
				}
			});

			this._rootElement = this._container.getRootElement();

			this.addMoveAnimation();
			this.addFadeAnimation();
		};

		$N.gui.Util.extend(TextItem, $N.gui.AbstractListItem);

		/**
		 * Sets the width of the TextItem.
		 *
		 * @method setWidth
		 *
		 * @param {Object} width The width of the TextItem.
		 *
		 * @return {Object} The TextItem object.
		 */
		TextItem.prototype.setWidth = function (width) {
			this._width = width;
			return this;
		};

		/**
		 * Sets the height of the TextItem.
		 *
		 * @method setHeight
		 *
		 * @param {Object} height The height of the TextItem.
		 *
		 * @return {Object} The TextItem object.
		 */
		TextItem.prototype.setHeight = function (height) {
			this._height = height;
			return this;
		};

		/**
		 * Highlights the TextItem.
		 *
		 * @method highlight
		 */
		TextItem.prototype.highlight = function () {
		};

		/**
		 * Removes the highlight from the TextItem.
		 *
		 * @method unHighlight
		 */
		TextItem.prototype.unHighlight = function () {
		};

		/**
		 * Updates the data stored within the TextItem.
		 *
		 * @method update
		 *
		 * @param {Object} data Object containing the new data.
		 */
		TextItem.prototype.update = function (data) {
			if (data) {
				this._text.setText(this._dataMapper.getText(data));
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.TextItem = TextItem;
		return TextItem;
	}
);