/**
 * ListItem is an implementation of AbstractComponent
 *
 * Creates a list element in markup for putting inside of a ListGroup.
 *
 * Example markup:
 *
 *     <nagra:listItem id="myItem" />
 *         <!-- other components /-->
 *     </nagra:listItem>
 *
 * @class $N.gui.ListItem
 * @extends $N.gui.AbstractComponent
 * @constructor
 * @param {Object} docRef The document reference.
 * @param {Object} parent The parent class.
 */
define('jsfw/gui/GUIObjects/Components/ListItem',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var ListItem;

		ListItem = function (docRef, parent) {
			ListItem.superConstructor.call(this, docRef);

			this._rootElement = docRef.createElement("li");
			this._innerElement = this._rootElement;

			if (parent) {
				parent.addChild(this);
			}
		};

		$N.gui.Util.extend(ListItem, $N.gui.AbstractComponent);

		var proto = ListItem.prototype;

		/**
		 * Applies the highlight CCS style or CSS Class, class takes
		 * priority over style
		 * @method highLight
		 */
		proto.highLight = function () {
			if (this.getCssHighlightClass()) {
				this._innerElement.setAttribute("class", this.getCssHighlightClass());
			} else if (this.getCssHighlightStyle()) {
				this.setCssStyle(this.getCssHighlightStyle(), true);
			}
		};

		/**
		 * Applies the normal CCS style or CSS Class, class takes
		 * priority over style
		 * @method unHighLight
		 */
		proto.unHighLight = function () {
			if (this.getCssClass()) {
				this._innerElement.setAttribute("class", this.getCssClass());
			} else if (this.getCssStyle()) {
				this.setCssStyle(this.getCssStyle(), true);
			}
		};

		/**
		 * Returns the class name of this component
		 * @method getClassName
		 * @return {string}
		 */
		proto.getClassName = function () {
		    return ("ListItem");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ListItem = ListItem;
		return ListItem;
    }
);