/**
 * Animated mosaic tiles are the same as mosaic tiles apart from
 * when they are highlighted then also grow in size
 * @class $N.gui.AnimatedMosaicTile
 * @extends $N.gui.MosaicTile
 * @constructor
 * @param {Object} docRef document reference to create this control
 * @param {Object} tileDataObj data associated with the tile
 * @param {Object} tileUrl url of the image to display
 * @param {Object} tileType type of the tile
 */
define('jsfw/gui/GUIObjects/Controls/List/animated/AnimatedMosaicTile',
    [
    'jsfw/gui/GUIObjects/Controls/List/MosaicTile',
    'jsfw/gui/helpers/Util'
    ],
    function (MosaicTile, Util) {

		function AnimatedMosaicTile(docRef, tileDataObj, tileUrl, tileType) {
			AnimatedMosaicTile.superConstructor.call(this, docRef, tileDataObj, tileUrl, tileType);

			this._scaleFactor = 1.12;
			this._xMove = null;
			this._yMove = null;
			this._duration = "200ms";

			this.setAnimationDuration(this._duration);
			this.addMoveAnimation();
			this.addScaleAnimation();
		}

		$N.gui.Util.extend(AnimatedMosaicTile, $N.gui.MosaicTile);

		/**
		 * Sets the amount of scaling to be used when a tile is
		 * highlighted
		 * @method setScaleFactor
		 * @param {Number} factor
		 */
		AnimatedMosaicTile.prototype.setScaleFactor = function (factor) {
			this._scaleFactor = factor;
		};

		/**
		 * Sets the times it takes for the tile to grow when
		 * selected
		 * @method setDuration
		 * @param {String} duration
		 */
		AnimatedMosaicTile.prototype.setDuration = function (duration) {
			this._duration = duration;
			this._scaleAnim.setDuration(this._duration);
			this._moveAnim.setDuration(this._duration);
		};

		/**
		 * Returns the amount of scaling used
		 * @method getScaleFactor
		 * @return {Number}
		 */
		AnimatedMosaicTile.prototype.getScaleFactor = function () {
			return this._scaleFactor;
		};

		/**
		 * Returns the duration used
		 * @method getDuration
		 * @return {String}
		 */
		AnimatedMosaicTile.prototype.getDuration = function () {
			return this._duration;
		};

		/**
		 * Overrides the setWidth method of MosaicTile
		 * @method setWidth
		 * @param {Number} newWidth
		 */
		AnimatedMosaicTile.prototype.setWidth = function (newWidth) {
			AnimatedMosaicTile.superClass.setWidth.call(this, newWidth);
			this._xMove = (-(newWidth / 2)) * (this._scaleFactor - 1);
		};

		/**
		 * Overrides the setHeight method of MosaicTile
		 * @method setHeight
		 * @param {Number} newHeight
		 */
		AnimatedMosaicTile.prototype.setHeight = function (newHeight) {
			AnimatedMosaicTile.superClass.setHeight.call(this, newHeight);
			this._yMove = (-(newHeight / 2)) * (this._scaleFactor - 1);
		};

		/**
		 * Overrides the highLight method of MosaicTile
		 * @method highLight
		 */
		AnimatedMosaicTile.prototype.highLight = function () {
			AnimatedMosaicTile.superClass.highLight.call(this);
			this.doMove(this.getX() + this._xMove, this.getY() + this._yMove);
			this.doScale(this._scaleFactor);
		};

		/**
		 * Overrides the unHighLight method of MosaicTile
		 * @method unHighLight
		 */
		AnimatedMosaicTile.prototype.unHighLight = function () {
			AnimatedMosaicTile.superClass.unHighLight.call(this);
			this.doMove(this.getX() - this._xMove, this.getY() - this._yMove);
			this.doScale(1);
		};

		/**
		 * Returns the name of this class
		 * @method getClassName
		 * @return {String}
		 */
		AnimatedMosaicTile.prototype.getClassName = function () {
			return ("AnimatedMosaicTile");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AnimatedMosaicTile = AnimatedMosaicTile;
		return AnimatedMosaicTile;
	}
);