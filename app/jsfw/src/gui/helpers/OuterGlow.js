/**
 * OuterGlow is a helper method which manipulates the DOM structure of nagra GUIObject objects to create a glow effect.
 *
 * OuterGlow can be instantiated from the JavaScript to create a glow around existing GUI objects, such as;
 *
 *     myContainerGlow = new $N.gui.OuterGlow(document, view.myContainer, "#ddeeff", 15);
 *     myButtonGlow = new $N.gui.OuterGlow(document, view.myButton, "black", 5);
 *
 * Or, you can use OuterGlow from within your own custom GUI controls and components to provide glow functionality.
 *
 * @class $N.gui.OuterGlow
 * 
 * @constructor
 * @param {Object} docRef Document object
 * @param {Object} parent Parent GUIObject to apply glow
 * @param {String} [colour='black'] Colour of the glow (e.g '#ff0000', 'red')
 * @param {Number} [intensity=15] Intensity of the glow
 */
define('jsfw/gui/helpers/OuterGlow',
    [],
    function () {

		function OuterGlow(docRef, parent, colour, intensity) {
			this._docRef = docRef || document;
			this._parent = parent;
	
			// initialise using parents attributes
			this._x = parent.getX ? parent.getX() : 0;
			this._y = parent.getY ? parent.getY() : 0;
			this._width = parent.getWidth ? parent.getWidth() : 0;
			this._height = parent.getHeight ? parent.getHeight() : 0;
			this._r = parent.getRounding ? parseInt(parent.getRounding(), 10) : 0;
			this._colour = colour || 'black';
			this._intensity = intensity ? parseInt(intensity, 10) : 15;
			this._visible = true;
	
			// create glow
			this.createGlow();
		}
	
		var proto = OuterGlow.prototype;
	
		/**
		 * Updates the intensity of the glow.
		 * @method setIntensity
		 * @param {Number} intensity The intensity of the glow
		 */
		proto.setIntensity = function (intensity) {
			this._intensity = parseInt(intensity, 10);
			this.createGlow();
		};
	
		/**
		 * Updates the colour of the glow.
		 * @method setColour
		 * @param {String} colour Either a recognised colour name, or a hex RGB value string
		 */
		proto.setColour = function (colour) {
			this._colour = colour;
			this.createGlow();
		};
	
		/**
		 * Shows the glow.
		 * @method show
		 */
		proto.show = function () {
			this._visible = true;
			this._rootElement.setAttribute("display", "inline");
		};
	
		/**
		 * Hides the glow.
		 * @method hide
		 */
		proto.hide = function () {
			this._visible = false;
			this._rootElement.setAttribute("display", "none");
		};
	
		/**
		 * Toggles the visbility of the glow.
		 * @method toggle
		 */
		proto.toggle = function () {
			if (this._visible) {
				this.hide();
			} else {
				this.show();
			}
		};
	
		/**
		 * Refreshes the glow DOM elements using the parent attributes.  Useful if the parent has been
		 * modified.
		 * @method refresh
		 */
		proto.refresh = function () {
			this._x = this._parent.getX ? this._parent.getX() : 0;
			this._y = this._parent.getY ? this._parent.getY() : 0;
			this._width = this._parent.getWidth ? this._parent.getWidth() : 0;
			this._height = this._parent.getHeight ? this._parent.getHeight() : 0;
			this._r = this._parent.getRounding ? parseInt(this._parent.getRounding(), 10) : 0;
			this._visible = true;
			this.createGlow();
		};
	
		/**
		 * Creates or re-creates the outer glow DOM elements.  This method is only required if you are directly manipulating
		 * the properties of the glow (using the mutator methods), such as the intensity or colour.
		 * Any existing glow elements attached to the parent DOM element will be removed before re-creating the glow.
		 * @method createGlow
		 */
		proto.createGlow = function () {
			// glow object only created if both intensity and colour have both been set
			if (this._intensity && this._colour) {
				// set the id of the new element
				var prefix = this._parent.getId() + "OuterGlow";
	
				// obtain references to the parent element and its container
				var parentSVGRef = this._parent.getRootElement();
				var outerElement = parentSVGRef.parentNode;
	
				// check if a glow for this element exists, or create a new one
				this._rootElement = this._docRef.getElementById(prefix);
				if (this._rootElement) {
					outerElement.removeChild(this._rootElement);
				}
				this._rootElement = this._createSVGObject(prefix);
	
				// insert the glow element behind the parent
				outerElement.insertBefore(this._rootElement, parentSVGRef);
	
				this.show();
			}
		};
	
		/**
		 * Creates an SVG outer glow group of elements
		 * @method _createSVGObject
		 * @private
		 * @param {String} prefix The prefix used for the naming of each element
		 * @return {Object} An SVG DOM object representing a complete glow
		 */
		proto._createSVGObject = function (prefix) {
			// define the parent group
			var group = this._docRef.createElement('g');
			group.setAttribute('id', prefix);
	
			// define gradients and add to the parent group
			var topGradient = this._createSVGLinearGradient(prefix + 'TopGradient', this._colour, 0, 0, 1, 0);
			var bottomGradient = this._createSVGLinearGradient(prefix + 'BottomGradient', this._colour, 0, 0, 0, 1);
			var leftGradient = this._createSVGLinearGradient(prefix + 'LeftGradient', this._colour, 1, 0, 0, 0);
			var rightGradient = this._createSVGLinearGradient(prefix + 'RightGradient', this._colour, 0, 1, 0, 0);
			var cornerGradient = this._createSVGRadialGradient(prefix + 'CornerGradient', this._colour);
			group.appendChild(topGradient);
			group.appendChild(bottomGradient);
			group.appendChild(leftGradient);
			group.appendChild(rightGradient);
			group.appendChild(cornerGradient);
	
			// define corner clip paths and add to the parent group
			var tlClipPath = this._createSVGClipPath(prefix + "ClipPathTL", this._x - this._intensity, this._y - this._intensity, this._intensity + this._r, this._intensity + this._r);
			var trClipPath = this._createSVGClipPath(prefix + "ClipPathTR", this._x + this._width - this._r, this._y - this._intensity, this._intensity + this._r, this._intensity + this._r);
			var blClipPath = this._createSVGClipPath(prefix + "ClipPathBL", this._x - this._intensity, this._y + this._height - this._r, this._intensity + this._r, this._intensity + this._r);
			var brClipPath = this._createSVGClipPath(prefix + "ClipPathBR", this._x + this._width - this._r, this._y + this._height - this._r, this._intensity + this._r, this._intensity + this._r);
			group.appendChild(tlClipPath);
			group.appendChild(trClipPath);
			group.appendChild(blClipPath);
			group.appendChild(brClipPath);
	
			// define rectangles for top, bottom, left and right
			var topRect = this._docRef.createElement('rect');
			topRect.setAttribute('x', this._x + this._r);
			topRect.setAttribute('y', this._y - this._intensity);
			topRect.setAttribute('width', this._width - (this._r * 2));
			topRect.setAttribute('height', this._intensity + this._r);
			topRect.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'TopGradient)');
	
			var bottomRect = this._docRef.createElement('rect');
			bottomRect.setAttribute('x', this._x + this._r);
			bottomRect.setAttribute('y', this._y + this._height - this._r);
			bottomRect.setAttribute('width', this._width - (this._r * 2));
			bottomRect.setAttribute('height', this._intensity + this._r);
			bottomRect.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'BottomGradient)');
	
			var leftRect = this._docRef.createElement('rect');
			leftRect.setAttribute('x', this._x - this._intensity);
			leftRect.setAttribute('y', this._y + this._r);
			leftRect.setAttribute('width', this._intensity + this._r);
			leftRect.setAttribute('height', this._height - (this._r * 2));
			leftRect.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'LeftGradient)');
	
			var rightRect = this._docRef.createElement('rect');
			rightRect.setAttribute('x', this._x + this._width - this._r);
			rightRect.setAttribute('y', this._y + this._r);
			rightRect.setAttribute('width', this._intensity + this._r);
			rightRect.setAttribute('height', this._height - (this._r * 2));
			rightRect.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'RightGradient)');
	
			// define corner circles
			var tlCircle = this._docRef.createElement('circle');
			tlCircle.setAttribute('cx', this._x + this._r);
			tlCircle.setAttribute('cy', this._y + this._r);
			tlCircle.setAttribute('r', this._intensity + this._r);
			tlCircle.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'CornerGradient)');
			tlCircle.setAttribute('clip-path', 'url(#' + prefix + 'ClipPathTL)');
	
			var trCircle = this._docRef.createElement('circle');
			trCircle.setAttribute('cx', this._x + this._width - this._r);
			trCircle.setAttribute('cy', this._y + this._r);
			trCircle.setAttribute('r', this._intensity + this._r);
			trCircle.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'CornerGradient)');
			trCircle.setAttribute('clip-path', 'url(#' + prefix + 'ClipPathTR)');
	
			var blCircle = this._docRef.createElement('circle');
			blCircle.setAttribute('cx', this._x + this._r);
			blCircle.setAttribute('cy', this._y + this._height - this._r);
			blCircle.setAttribute('r', this._intensity + this._r);
			blCircle.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'CornerGradient)');
			blCircle.setAttribute('clip-path', 'url(#' + prefix + 'ClipPathBL)');
	
			var brCircle = this._docRef.createElement('circle');
			brCircle.setAttribute('cx', this._x + this._width - this._r);
			brCircle.setAttribute('cy', this._y + this._height - this._r);
			brCircle.setAttribute('r', this._intensity + this._r);
			brCircle.setAttribute('style', 'stroke-width:0;fill:url(#' + prefix + 'CornerGradient)');
			brCircle.setAttribute('clip-path', 'url(#' + prefix + 'ClipPathBR)');
	
			// add components to the parent group
			group.appendChild(topRect);
			group.appendChild(bottomRect);
			group.appendChild(leftRect);
			group.appendChild(rightRect);
			group.appendChild(tlCircle);
			group.appendChild(trCircle);
			group.appendChild(blCircle);
			group.appendChild(brCircle);
	
			return group;
		};
	
		/**
		 * Creates an SVG linear gradient element
		 * @method _createSVGLinearGradient
		 * @private
		 * @param {String} name Id element
		 * @param {String} colour Colour of gradient
		 * @param {Number} x1 Start x coordinate
		 * @param {Number} x2 End x coordinate
		 * @param {Number} y1 Start y coordinate
		 * @param {Number} y2 End y coordinate
		 */
		proto._createSVGLinearGradient = function (name, colour, x1, x2, y1, y2) {
			var gradient = this._docRef.createElement('linearGradient');
			gradient.setAttribute('id', name);
			gradient.setAttribute('x1', x1);
			gradient.setAttribute('x2', x2);
			gradient.setAttribute('y1', y1);
			gradient.setAttribute('y2', y2);
	
			var stop0 = this._docRef.createElement('stop');
			stop0.setAttribute('offset', '0');
			stop0.setAttribute('stop-color', colour);
			stop0.setAttribute('stop-opacity', '0.8');
	
			var stop1 = this._docRef.createElement('stop');
			stop1.setAttribute('offset', '0.9');
			stop1.setAttribute('stop-color', colour);
			stop1.setAttribute('stop-opacity', '0.02');
	
			var stop2 = this._docRef.createElement('stop');
			stop2.setAttribute('offset', '1');
			stop2.setAttribute('stop-color', colour);
			stop2.setAttribute('stop-opacity', '0');
	
			gradient.appendChild(stop0);
			gradient.appendChild(stop1);
			gradient.appendChild(stop2);
	
			return gradient;
		};
	
		/**
		 * Creates an SVG radial gradient element
		 * @method _createSVGRadialGradient
		 * @private
		 * @param {String} name Id element
		 * @param {String} colour Colour of gradient
		 * @return {Object} SVG gradient object
		 */
		proto._createSVGRadialGradient = function (name, colour) {
			var gradient = this._docRef.createElement('radialGradient');
			gradient.setAttribute('id', name);
	
			var stop0 = this._docRef.createElement('stop');
			stop0.setAttribute('offset', '0');
			stop0.setAttribute('stop-color', colour);
			stop0.setAttribute('stop-opacity', '0.8');
	
			var stop1 = this._docRef.createElement('stop');
			stop1.setAttribute('offset', '0.9');
			stop1.setAttribute('stop-color', colour);
			stop1.setAttribute('stop-opacity', '0.02');
	
			var stop2 = this._docRef.createElement('stop');
			stop2.setAttribute('offset', '1');
			stop2.setAttribute('stop-color', colour);
			stop2.setAttribute('stop-opacity', '0');
	
			gradient.appendChild(stop0);
			gradient.appendChild(stop1);
			gradient.appendChild(stop2);
	
			return gradient;
		};
	
		/**
		 * Create and SVG rectangular clip path
		 * @method _createSVGClipPath
		 * @private
		 * @param {String} name Id of the clip path
		 * @param {Number} x x position
		 * @param {Number} y y position
		 * @param {Number} width Width of clip path
		 * @param {Number} height Height of clip path
		 * @return {Object} SVG clip path object
		 */
		proto._createSVGClipPath = function (name, x, y, width, height) {
			var clipRect = this._docRef.createElement('rect');
			clipRect.setAttribute('x', x);
			clipRect.setAttribute('y', y);
			clipRect.setAttribute('width', width);
			clipRect.setAttribute('height', height);
			var clipPath = this._docRef.createElement('clipPath');
			clipPath.setAttribute('id', name);
			clipPath.appendChild(clipRect);
			return clipPath;
		};
	
		/**
		 * Returns the class name of this component
		 * @method getClassName
		 * @return {String}
		 */
		proto.getClassName = function () {
			return "OuterGlow";
		};
	
		/**
		 * String description of the object
		 * @method toString
		 * return {String}
		 */
		proto.toString = function () {
			return "OuterGlow on " + this._parent.getId() + " - " + String(this._x) + " y:" + String(this._y) + " w:" + String(this._width) + " h:" + String(this._height) + " r:" + String(this._r) + " c:" + this._colour + " i:" + String(this._intensity);
		};
	
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.OuterGlow = OuterGlow;
		return OuterGlow;
	}
);