/**
 * PortalMessages is a component designed for use in the portal.
 * It contains a list used to display new messages
 * @class $N.gui.PortalMessages
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.GUIObject
 * #depends MessagePromotionItem.js
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var PortalMessages = function (docRef, parent) {
		var me = this;
		PortalMessages.superConstructor.call(this, docRef);

		this._messageStatusChangedListenerId = $N.apps.util.EventManager.subscribe("oneMailRead", this.messageStatusChangedListener, this);
		this._container = new $N.gui.Group(this._docRef);
		this._list = new $N.gui.PageableListWithArrows(this._docRef, this._container);
		this._textGroup = new $N.gui.Group(this._docRef, this._container);
		this._textBackground = new $N.gui.BackgroundBox(this._docRef, this._textGroup);
		this._text = new $N.gui.TextArea(this._docRef, this._textGroup);
		this._noMailMessage = new $N.gui.Label(this._docRef, this._container);

		this._list.configure({
			x: 0,
			y: 54.5,
			itemHeight: 117,
			itemTemplate: $N.gui.MessagePromotionItem,
			visibleItemCount: 4,
			dataMapper: $N.app.DataMappers.getMessageMails(),
			ItemHighlightedImmediateCallback: function (data) {
				var dataMapper = me._list.getDataMapper();
				if (!me._textGroup.isVisible()) {
					me._textGroup.show();
				}
				me._text.setText(dataMapper.getMailContent(data));
			},
			upArrowProperties: {
				x: 537,
				y: -27
			},
			downArrowProperties: {
				x: 537,
				y: 478
			}
		});
		this._list.initialise();
		this._noMailMessage.configure({
			x: 3,
			y: 252,
			width: 1176,
			cssClass: "noMailText",
			visible: false
		});
		this._textGroup.configure({
			x: 595.5,
			y: 2.5,
			visible: false
		});
		this._textBackground.configure({
			width: 576,
			height: 576,
			cssClass: "recordingsWindowBackgroundPassivated"
		});
		this._text.configure({
			x: 25.5,
			y: 72,
			width: 525,
			height: 508,
			cssClass: "textContentDescription"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(PortalMessages, $N.gui.GUIObject);

	/**
	 * @method messageStatusChangedListener
	 * @param {Object} evt
	 */
	PortalMessages.prototype.messageStatusChangedListener = function (evt) {
		var data = this._list.getData(),
			i,
			msgId;
		if (data && data.length) {
			msgId = evt.data;
			for (i = 0; i < data.length; i++) {
				if (msgId === this._list.getDataMapper().getMailId(data[i])) {
					this._list.getDataMapper().setMailReadStatus(data[i]);
					this._list.visibleItemUpdate(i);
				}
			}
		}
	};



	/**
	 * @method setEmptyText
	 * @param {String} emptyText
	 */
	PortalMessages.prototype.setEmptyText = function (emptyText) {
		this._noMailMessage.setText(emptyText);
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	PortalMessages.prototype.preview = function (data) {
		if (data) {
			this._noMailMessage.hide();
			this._list.show();
			this._list.setData(data);
			this._list.displayData();
		} else {
			this._list.hide();
			this._textGroup.hide();
			this._noMailMessage.show();
		}
	};

	/**
	 * @method activate
	 */
	PortalMessages.prototype.activate = function () {
		var me = this;
		this._list.focus();
	};

	/**
	 * @method passivate
	 */
	PortalMessages.prototype.passivate = function () {
		this._list.defocus();
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	PortalMessages.prototype.keyHandler = function (key) {
		return this._list.keyHandler(key);
	};

	/**
	 * @method getController
	 * @return {bool} false
	 */
	PortalMessages.prototype.getController = function () {
		return false;
	};

	$N.gui.PortalMessages = PortalMessages;
}($N || {}));
