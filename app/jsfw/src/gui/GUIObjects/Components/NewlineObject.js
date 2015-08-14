/**
 * A newline object is a simple object that represents a text break. This object
 * is designed for use with styled text GUI components, such as
 * `$N.gui.StyledTextArea`.
 *
 * Example mark-up (using an `$N.gui.StyledTextArea`):
 *
 *     <nagra:styledTextArea id="myStyledTextArea">
 *         <nagra:newlineObject/>
 *     </nagra:styledTextArea>
 *
 * Example code:
 *
 *     var styledTextArea = new styledTextArea(document),
 *         newLineObject = new $N.gui.NewlineObject(document, parent);
 *
 *     styledTextArea.addChild(newLineObject);
 *
 * Note: To save memory, a single `NewlineObject` instance may be used (appended)
 * multiple times.
 *
 * @class $N.gui.NewlineObject
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @constructor
 */
define('jsfw/gui/GUIObjects/Components/NewlineObject',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createNewlineElement: function (docRef) {
					return docRef.createElement("tbreak");
				}
			},
			HTML: {
				createNewlineElement: function (docRef) {
					return docRef.createElement("br");
				}
			}
		}[$N.gui.GUIObject.mode];

		var NewlineObject = function (docRef) {
			NewlineObject.superConstructor.call(this, docRef);
			this._rootElement = docRef;
		};

		$N.gui.Util.extend(NewlineObject, $N.gui.AbstractComponent);

		/**
		 * Create and return a new newline node (element). Note: The same
		 * `NewlineObject` can be used multiple times.
		 *
		 * @method getNewlineNode
		 * @return a newline element representing a newline object.
		 */
		NewlineObject.prototype.getNewlineNode = function (docRef) {
			return domAbstraction.getNewlineElement(docRef);
		};

		/**
		 * Return the class name of this component.
		 * @method getClassName
		 * @return {string}
		 */
		NewlineObject.prototype.getClassName = function () {
			return ("NewlineObject");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.NewlineObject = NewlineObject;
		return NewlineObject;
    }
);