/**
 * Group is an implementation of AbstractComponent
 *
 * Creates an element in markup for grouping other related components and controls.
 *
 * Example markup:
 *
 *     <nagra:group id="myGroup">
 *         <!-- other components /-->
 *     </nagra:group>
 *
 * @class $N.gui.Group
 * @extends $N.gui.AbstractComponent
 * @constructor
 * @param {Object} docRef The document reference.
 * @param {Object} parent The parent class.
 */
define('jsfw/gui/GUIObjects/Components/Group',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var Group;

		if ($N.gui.GUIObject.mode === "HTML") {
			Group = function (docRef, parent) {
				Group.superConstructor.call(this, docRef);

				this._rootElement = docRef.createElement("div");
				this._innerElement = this._rootElement;
				this._rootElement.style.padding = "0px";
				this._rootElement.style.position = "absolute";

				if (parent) {
					parent.addChild(this);
				}
			};
		} else {
			Group = function (docRef, parent) {

			    Group.superConstructor.call(this, docRef);

			    this._rootElement = this._docRef.createElement("g");
			    this._innerElement = this._rootElement;

				if (parent) {
					parent.addChild(this);
				}
			};
		}

		$N.gui.Util.extend(Group, $N.gui.AbstractComponent);

		/**
		 * Returns the class name of this component
		 * @method getClassName
		 * @return {string}
		 */
		Group.prototype.getClassName = function () {
		    return ("Group");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Group = Group;
		return Group;
    }
);