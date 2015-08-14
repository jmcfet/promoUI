/**
 *
 * @class $N.gui.MessagePromotionItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.MessageListItem
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function MessagePromotionItem(docRef, parent) {
		MessagePromotionItem.superConstructor.call(this, docRef);
		this._container.configure({
			width : 570
		});
		this._highlight.configure({
			width : 570
		});
		this._mailTitle.configure({
			width : 519
		});
	}
	$N.gui.Util.extend(MessagePromotionItem, $N.gui.MessageListItem);

	$N.gui.MessagePromotionItem = MessagePromotionItem;
}(window.parent.$N || {}));