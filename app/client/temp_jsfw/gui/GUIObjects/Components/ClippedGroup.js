/**
 * ClippedGroup is an implementation of AbstractComponent
 *
 * Creates a reference to a clipped group object and is used to define a clipped window on screen that
 * other graphical objects can be drawn within.
 *
 * Example markup:
 *
 *     <nagra:clippedGroup id="myGroup" x="100" y="100" width="200" height="200">
 *         <!-- other components /-->
 *     </nagra:clippedGroup>
 *
 * @class $N.gui.ClippedGroup
 * @extends $N.gui.AbstractComponent
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef DOM reference
 * @param {Object} parent Parent class
 */
define('jsfw/gui/GUIObjects/Components/ClippedGroup',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					var newElement = docRef.createElementNS("http://www.ekioh.com/2007/ekioh", "clippedGroup");
					return {
						root: newElement,
						inner : newElement
					};
				}
			},
			HTML: {
				createElement: function (docRef) {
					var rootElement = docRef.createElement("div");
					rootElement.style.overflow = "hidden";
					return {
						root: rootElement,
						inner: rootElement
					};
				}
			}
		}[$N.gui.GUIObject.mode];

		function ClippedGroup(docRef, parent) {

			ClippedGroup.superConstructor.call(this, docRef);

			var element =  domAbstraction.createElement(this._docRef);
			this._rootElement = element.root;
			this._innerElement = element.inner;

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(ClippedGroup, $N.gui.AbstractComponent);

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ClippedGroup = ClippedGroup;
		return ClippedGroup;
    }
);