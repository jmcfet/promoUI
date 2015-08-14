/**
 * @class $N.gui.MessageListItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.TextItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {

	function MessageListItem(docRef, parent) {
		MessageListItem.superConstructor.call(this, docRef);
		this._data = null;
		this._isHighlighted = false;
		this._isFocused = false;
		this._ItemHighlightedTimeOutMS = 5000;
		this._ItemHighlightedTimer = null;
		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 661.5
		});
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			width: 661.5,
			height: 117,
			cssClass: "highlightLight",
			visible: false
		});
		this._mailIcon = new $N.gui.Image(docRef, this._container);
		this._mailIcon.configure({
			x: 27,
			y: 25.5
		});
		this._mailDate = new $N.gui.Label(docRef, this._container);
		this._mailDate.configure({
			x: 82,
			y: 19.5,
			cssClass: "messageListItemDate"
		});
		this._mailTitle = new $N.gui.DelayedScrollingLabel(docRef, this._container);
		this._mailTitle.configure({
			x: 27,
			y: 60,
			width: 607,
			duration: "250ms",
			cssClass: "messageListItemTitle"
		});
		this._rootSVGRef = this._container.getRootSVGRef();
	}
	$N.gui.Util.extend(MessageListItem, $N.gui.TextItem);

	MessageListItem.prototype.setMailReadIcon = function () {
		this._mailIcon.setY(18);
		this._mailIcon.setHref("../../../customise/resources/images/net/mensagens_opened_envelope.png");
	};

	MessageListItem.prototype.setMailUnreadIcon = function () {
		this._mailIcon.setY(25.5);
		this._mailIcon.setHref("../../../customise/resources/images/net/mensagens_closed_envelope.png");
	};

	MessageListItem.prototype.update = function (data) {
		var readStatus;
		this._data = data;
		if (data) {
			readStatus = this._dataMapper.getMailReadStatus(data);
			if (readStatus) {
				this.setMailReadIcon();
			} else {
				this.setMailUnreadIcon();
			}
			this._mailDate.setText(this._dataMapper.getMailDate(data));
			this._mailTitle.setText(this._dataMapper.getMailTitle(data), true);
		}
	};

	MessageListItem.prototype.itemHighlightTimeoutClear = function () {
		if (this._ItemHighlightedTimer) {
			clearTimeout(this._ItemHighlightedTimer);
			this._ItemHighlightedTimer = null;
		}
	};

	MessageListItem.prototype.setMailRead = function () {
		this.setMailReadIcon();
		this._dataMapper.setMailReadStatus(this._data);
		$N.app.MessageUtil.setMessageMailRead(this._dataMapper.getMailId(this._data));
	};

	MessageListItem.prototype.highlight = function () {
		var me = this;
		this._isHighlighted = true;
		if (this._isFocused) {
			this._highlight.show();
			if (this._mailTitle.isVisible()) {
				this._mailTitle.start();
			}
			this.itemHighlightTimeoutClear();
			if (this._data && !this._dataMapper.getMailReadStatus(this._data)) {
				this._ItemHighlightedTimer = setTimeout(function () {
					me.setMailRead();
				}, this._ItemHighlightedTimeOutMS);
			}
		}
	};

	MessageListItem.prototype.unHighlight = function () {
		var readStatus;
		if (this._mailTitle.isVisible()) {
			this._mailTitle.stop();
		}
		this._highlight.hide();
		this.itemHighlightTimeoutClear();
		if (this._isHighlighted && this._isFocused && this._data) {
			readStatus = this._dataMapper.getMailReadStatus(this._data);
			if (!readStatus) {
				this.setMailRead();
			}
		}
		this._isHighlighted = false;
	};

	MessageListItem.prototype.focus = function () {
		var me = this;
		this._isFocused = true;
		if (this._isHighlighted) {
			this._highlight.show();
			if (this._mailTitle.isVisible()) {
				this._mailTitle.start();
			}
			this.itemHighlightTimeoutClear();
			if (this._data && !this._dataMapper.getMailReadStatus(this._data)) {
				this._ItemHighlightedTimer = setTimeout(function () {
					me.setMailRead();
				}, this._ItemHighlightedTimeOutMS);
			}
		} else {
			this._highlight.hide();
		}
	};

	MessageListItem.prototype.defocus = function () {
		var readStatus;
		this._highlight.hide();
		if (this._mailTitle.isVisible()) {
			this._mailTitle.stop();
		}
		this.itemHighlightTimeoutClear();
		if (this._isFocused && this._isHighlighted && this._data) {
			readStatus = this._dataMapper.getMailReadStatus(this._data);
			if (!readStatus) {
				this.setMailRead();
			}
		}
		this._isFocused = false;
	};

	$N.gui = $N.gui || {};
	$N.gui.MessageListItem = MessageListItem;
}($N || {}));