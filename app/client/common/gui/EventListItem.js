/**
 * EventListItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.EventListItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 */

(function ($N) {

	function EventListItem(docRef) {
		EventListItem.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "EventListItem");
		this._container = new $N.gui.ClippedGroup(this._docRef);
		this._container.setWidth(1620);
		this._container.setHeight(150);
		this._chanLogo = new $N.gui.Image(this._docRef, this._container);
		this._eventName = new $N.gui.Label(this._docRef, this._container);

		this._chanLogo.configure({
			x: 100,
			y: 5,
			width: 175,
			height: 60,
			quality: 1
		});

		this._eventName.configure({
			x: 300,
			y: 52,
			width: 1150,
			cssClass: "eventName"
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(EventListItem, $N.gui.AbstractListItem);

	var proto = EventListItem.prototype;

	/**
	 * Sets the width of the EventListItem.
	 *
	 * @method setWidth
	 *
	 * @param {Number} width The width of the EventListItem.
	 * @return {Object} A reference to EventListItem (this).
	 */
	proto.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the EventListItem.
	 *
	 * @method setHeight
	 *
	 * @param {Number} height The height of the EventListItem.
	 * @return {Object} A reference to EventListItem (this).
	 */
	proto.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the EventListItem.
	 *
	 * @method highlight
	 */
	proto.highlight = function (instant) {
	};

	/**
	 * Removes the highlight from the EventListItem.
	 *
	 * @method unHighlight
	 */
	proto.unHighlight = function () {
	};

	/**
	 * Updates the data stored within the EventListItem.
	 * @method update
	 * @param {Object} data Object containing the new data.
	 */
	proto.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this._chanLogo.setHref(this._dataMapper.getChannelLogo(data));
			this._eventName.setText(this._dataMapper.getTitle(data));
		}
		this._log("update", "Exit");
	};

	/**
	 * Sets the width of the channel logo.
	 * @method setChannelLogoWidth
	 * @param {Number} width The new width of the channel logo.
	 */
	proto.setChannelLogoWidth = function (width) {
		this._chanLogo.setWidth(width);
	};

	/**
	 * Sets the height of the channel logo.
	 * @method setChannelLogoHeight
	 * @param {Number} height The new height of the channel logo.
	 */
	proto.setChannelLogoHeight = function (height) {
		this._chanLogo.setHeight(height);
	};

	/**
	 * Sets the X position of the channel logo.
	 * @method setChannelLogoXPosition
	 * @param {Number} xCoordinate The new X coordinate of the channel logo.
	 */
	proto.setChannelLogoXPosition = function (xCoordinate) {
		this._chanLogo.setX(xCoordinate);
	};

	/**
	 * Sets the Y position of the channel logo.
	 * @method setChannelLogoXPosition
	 * @param {Number} yCoordinate The new Y coordinate of the channel logo.
	 */
	proto.setChannelLogoYPosition = function (yCoordinate) {
		this._chanLogo.setY(yCoordinate);
	};

	/**
	 * Hides the event name label..
	 * @method hideEventName
	 */
	proto.hideEventName = function () {
		this._eventName.hide();
	};

	/**
	 * Shows the event name label..
	 * @method showEventName
	 */
	proto.showEventName = function () {
		this._eventName.show();
	};

	$N.gui = $N.gui || {};
	$N.gui.EventListItem = EventListItem;

}($N || {}));
