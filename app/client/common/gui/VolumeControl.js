/**
 * The VolumeControl class updates, displays and hides the volume controls
 * that are shown on screen when the volume keys are pressed.
 *
 * @class $N.app.VolumeControl
 * @static
 * @requires $N.apps.core.Log
 */
var $N = $N || {};
$N.app = $N.app || {};
$N.app.VolumeControl = (function () {

	var log = new $N.apps.core.Log("CommonGUI", "VolumeControl"),
		displayTimeout = null,
		_isEnabled = true,
		timeoutDuration = 5000,
		MUTE_ICON = "customise/resources/images/%RES/icons/volume_mute.png",
		SPEAKER_ICON = "customise/resources/images/%RES/icons/volume_ativo.png",
		view = {},
		wasClockVisible = false;

	/**
	 * Updates the progress bar and the volume value displayed
	 *
	 * @method updateDisplay
	 * @private
	 * @param {Number} volume
	 */
	function updateDisplay(volume) {
		if (volume === 0) {
			view.speakerImage.setHref(MUTE_ICON);
			view.volumeProgressBar.hide();
			view.progressBarBackground.hide();
		} else {
			view.speakerImage.setHref(SPEAKER_ICON);
			view.volumeProgressBar.show();
			view.progressBarBackground.show();
		}
		view.volumeProgressBar.setProgress(volume);
	}

	return {

		/**
		 * Adds the volume control elements to the DOM
		 *
		 * @method initialise
		 */
		initialise: function (viewObject) {
			log("initialise", "Enter");
			view = viewObject;
			log("initialise", "Exit");
		},

		/**
		 * @method setIsEnabled
		 * @param isEnabled
		 */
		setIsEnabled: function (isEnabled) {
			_isEnabled = isEnabled;
		},

		/**
		 * Shows the volume controls
		 * @method show
		 * @param {Number} volume
		 */
		show: function (volume) {
			log("show", "Enter");
			var me = this;
			if (displayTimeout) {
				clearTimeout(displayTimeout);
			} else {
				// First time we are show-ing Volume Control
				if ($N.app.ClockDisplay.isVisible()) {
					wasClockVisible = true;
					$N.app.ClockDisplay.hide(true);
				} else {
					wasClockVisible = false;
				}
			}
			displayTimeout = setTimeout(me.hide, timeoutDuration);
			updateDisplay(volume);
			view.show();
			view.bringToFront();
			log("show", "Exit");
		},

		/**
		 * Hide the volume controls
		 *
		 * @method hide
		 */
		hide: function () {
			log("hide", "Enter");
			if (displayTimeout) {
				clearTimeout(displayTimeout);
			}
			displayTimeout = null;
			view.hide();
			if (wasClockVisible) {
				wasClockVisible = false;
				$N.app.ClockDisplay.show();
			}
			log("hide", "Exit");
		},

		/**
		 * @method resetWasClockVisible
		 */
		resetWasClockVisible: function () {
			wasClockVisible = false;
		},

		/**
		 * Set the timeout period for which the volume control display is shown
		 *
		 * @method setTimeoutDuration
		 * @param {Number} milliseconds
		 */
		setTimeoutDuration: function (milliseconds) {
			timeoutDuration = milliseconds;
		},

		/**
		 * @method handleVolumeUp
		 */
		handleVolumeUp: function () {
			if (_isEnabled) {
				this.show($N.app.AudioManager.increaseVolume());
			}
		},

		/**
		 * @method handleVolumeDown
		 */
		handleVolumeDown: function () {
			if (_isEnabled) {
				this.show($N.app.AudioManager.reduceVolume());
			}

		},

		/**
		 * @method handleVolumeMute
		 */
		handleVolumeMute: function () {
			if (_isEnabled) {
				$N.app.AudioManager.toggleMute();
				this.show($N.app.AudioManager.getCurrentVolume());
			}
		}
	};
}());
