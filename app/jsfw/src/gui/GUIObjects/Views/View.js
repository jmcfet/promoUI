/**
 * Superclass of all custom views. Defines the logic for tabs between
 * controls and associated key presses in the view. Maintains a state of
 * current selected control etc...
 * NOTE: this is about 2% complete
 * @class $N.gui.View
 *
 * @constructor
 */
define('jsfw/gui/GUIObjects/Views/View',
    [],
    function () {
    	
		function View() {
		
			this.selectedControl = 0;
		
			/**
			 * Control array that stores all the controls defined in the view
			 * @property {Array} controls
			 */
			this.controls = [];
		
			/**
			 * Passes focus the next control in the controls array
			 * @method highLightNext
			 */
			this.highLightNext = function () {
				if (this.selectedControl < 4) { //this.controls.length - 1 ) {
					this.controls[this.selectedControl].unHighLight();
					this.selectedControl++;
					this.controls[this.selectedControl].highLight();
				}
			};
		
			/**
			 * Passes focus the previous control in the controls array
			 * @method highLightPrevious
			 */
			this.highLightPrevious = function () {
				if (this.selectedControl > 3) {
					this.controls[this.selectedControl].unHighLight();
					this.selectedControl--;
					this.controls[this.selectedControl].highLight();
				}
			};
		
			/**
			 * Entry point of the key press event for the view
			 * @method keyHandler
			 * @param key {string} the key that was pressed in the parent view
			 */
			this.keyHandler = function (key) {
				var handled = this.controls[this.selectedControl].keyHandler(key);
				if (!handled) {
					switch (key) {
					case "up":
					case "ok":
						this.highLightPrevious();
						break;
					case "left":
						this.highLightPrevious();
						break;
					case "right":
						this.highLightNext();
						break;
					default:
						break;
					}
				}
			};
		}
		
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.View = View;
		return View;
	}
);