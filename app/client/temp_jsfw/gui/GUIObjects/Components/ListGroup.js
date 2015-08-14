/**
 * ListGroup is an implementation of AbstractComponent
 *
 * Creates an element in markup for grouping other related components and controls.
 *
 * Example markup:
 *
 *     <nagra:listGroup id="myGroup">
 *         <!-- other components /-->
 *     </nagra:listGroup>
 *
 * @class $N.gui.ListGroup
 * @extends $N.gui.AbstractComponent
 * @constructor
 * @param {Object} docRef The document reference.
 * @param {Object} parent The parent class.
 */
define('jsfw/gui/GUIObjects/Components/ListGroup',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var ListGroup;

		ListGroup = function (docRef, parent) {
			ListGroup.superConstructor.call(this, docRef);

			this._rootElement = docRef.createElement("ul");
			this._innerElement = this._rootElement;

			if (parent) {
				parent.addChild(this);
			}
		};

		$N.gui.Util.extend(ListGroup, $N.gui.AbstractComponent);

		/**
		 * Returns the class name of this component
		 * @method getClassName
		 * @return {string}
		 */
		ListGroup.prototype.getClassName = function () {
		    return ("ListGroup");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ListGroup = ListGroup;
		return ListGroup;
    }
);