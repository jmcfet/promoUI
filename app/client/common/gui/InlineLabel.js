/**
 * An inline element which lets the browser control the flow
 * WORK IN PROGRESS
 * @class $N.gui.InlineLabel
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.GUIObject
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {

	function InlineLabel(docRef, parent) {

		InlineLabel.superConstructor.call(this, docRef);

		this._rootElement = docRef.createElement("span");
		this._innerElement = this._rootElement;
		this._text = "";

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(InlineLabel, $N.gui.AbstractComponent);

	/**
	 * @method setText
	 * @param text
	 */
	InlineLabel.prototype.setText = function (text) {
		if (text !== this._text) {
			this._text = text;
			this._rootElement.textContent = this._text;
		}
	};

	/**
	 * @method getText
	 * @return {string} The Inlinelabel text.
	 */

	InlineLabel.prototype.getText = function () {
		return this._text;
	};

	$N.gui = $N.gui || {};
	$N.gui.InlineLabel = InlineLabel;
}($N || {}));
