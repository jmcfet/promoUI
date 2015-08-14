/**
 * @class $N.gui.AudioVideoFlags
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var AudioVideoFlags = function (docRef, parent) {
		AudioVideoFlags.superConstructor.call(this, docRef);

		this._maxFlags = 4;
		this._currentFlags = 0;
		this._flags = [];

		this._flagWidth = 76.5;
		this._flagheight = 76.5;
		this._flagSpacing = 19.5;

		this._container = new $N.gui.Container(this._docRef);

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		this.initialise();
	};
	$N.gui.Util.extend(AudioVideoFlags, $N.gui.GUIObject);

	/**
	 * @method initialise
	 */
	AudioVideoFlags.prototype.initialise = function () {
		var i,
			newFlag,
			loadSuccessfulCallback = function () {
				this.show();
			};
		for (i = 0; i < this._maxFlags; i++) {
			newFlag = new $N.gui.Image(this._docRef, this._container);
			newFlag.configure({
				x: i * (this._flagWidth + this._flagSpacing),
				y: 0,
				width: this._flagWidth,
				height: this._flagheight,
				loadSuccessful: loadSuccessfulCallback,
				visible: false
			});
			this._flags.push(newFlag);
		}
	};

	/**
	 * @method reset
	 */
	AudioVideoFlags.prototype.reset = function () {
		var i,
			loopLength = this._currentFlags;
		for (i = 0; i < loopLength; i++) {
			this._flags[i].hide();
		}
		this._currentFlags = 0;
	};

	/**
	 * @method addFlag
	 * @param {String} flag
	 */
	AudioVideoFlags.prototype.addFlag = function (flag) {
		var imageUrl;
		if (this._currentFlags < this._maxFlags) {
			imageUrl = $N.app.ImageUtil.getAudioVideoFlagUrl(flag);
			if (imageUrl) {
				if (this._flags[this._currentFlags].getHref() !== imageUrl) {
					this._flags[this._currentFlags].hide();
					this._flags[this._currentFlags].setHref(imageUrl);
				} else {
					this._flags[this._currentFlags].show();
				}
				this._currentFlags++;
			}
		}
	};

	/**
	 * @method setData
	 * @param {Array} data
	 */
	AudioVideoFlags.prototype.update = function (data) {
		this.reset();
		var i,
			loopLength = data.length;
		for (i = 0; i < loopLength; i++) {
			this.addFlag(data[i]);
		}
	};

	/**
	 * @method hasFlags
	 * @return {bool} True if any flags are set
	 */
	AudioVideoFlags.prototype.hasFlags = function () {
		return (this._currentFlags > 0);
	};

	/**
	 * @method setCssClass
	 * @param {String} className
	 */
	AudioVideoFlags.prototype.setCssClass = function (className) {
		this._container.setCssClass(className);
	};

	$N.gui.AudioVideoFlags = AudioVideoFlags;
}($N || {}));