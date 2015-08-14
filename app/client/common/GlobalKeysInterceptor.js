/**
 * Global keys interceptor for
 */

var GlobalKeysInterceptor = (function () {

	var log = new $N.apps.core.Log("HELPER", "GlobalKeysInterceptor"),
		recentKeyPress;

	/**
	 * Examine a key press and take default action
	 * @method keyHandler
	 * @private
	 * @param {String} key
	 * @return {Boolean} true if key is handled
	 */
	function keyHandler(key) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			activeContext = $N.apps.core.ContextManager.getActiveContext(),
			activeContextID = (activeContext) ? activeContext.getId() : null,
			navigateToMusic = function (e) {
				// We do not normally navigate, this is a special case for NETUI-1624
				if (e && e.action === $N.app.constants.YES_OPTION) {
					$N.apps.core.ContextManager.navigate("MUSIC", {"activeMode": "musicKey"});
				}
			},
			navigateToMosaic = function (e) {
				// We do not normally navigate, this is a special case for NETUI-1624
				if (e && e.action === $N.app.constants.YES_OPTION) {
					$N.apps.core.ContextManager.navigate("MOSAIC", {"activeMode": "mosaicKey"});
				}
			};

		switch (key) {
		case keys.KEY_TV:
			if (activeContextID !== "ZAPPER") {
				$N.app.ContextHelper.openContext("ZAPPER");
				handled = true;
			}
			break;
		case keys.KEY_HOME:
		case keys.KEY_MENU:
			if (activeContextID !== "PORTAL") {
				$N.app.ContextHelper.openContext("PORTAL");
				handled = true;
			}
			break;
		case keys.KEY_GUIDE:
			if (activeContextID !== "LISTGUIDE") {
				$N.app.ContextHelper.openContext("LISTGUIDE");
				handled = true;
			}
			break;
		case keys.KEY_PPV:
			if (activeContextID !== "LISTGUIDE") {
				$N.app.ContextHelper.openContext("LISTGUIDE", {activationContext: {"genreToBeLoaded": $N.app.genreUtil.GENRE_PPV}});
				handled = true;
			}
			break;
		case keys.KEY_VOD:
		case keys.KEY_VIEW:
			if ($N.app.FeatureManager.isVODEnabled() && activeContextID !== "NOW") {
				$N.app.ContextHelper.openContext("NOW");
				handled = true;
			}
			break;
		case keys.KEY_VOL_UP:
			$N.app.VolumeControl.handleVolumeUp();
			handled = true;
			break;
		case keys.KEY_VOL_DOWN:
			$N.app.VolumeControl.handleVolumeDown();
			handled = true;
			break;
		case keys.KEY_MUTE:
			$N.app.VolumeControl.handleVolumeMute();
			handled = true;
			break;
		case keys.KEY_POWER:
			$N.common.helper.PowerManager.togglePowerState();
			handled = true;
			break;
		case keys.KEY_FAVOURITES:
			$N.app.FavouritesUtil.toggleFavourites();
			handled = true;
			break;
		case keys.KEY_AGORA:
			if ($N.apps.core.ContextManager.getActiveContext()._id === "AGORA") {
				$N.app.ContextHelper.openContext("ZAPPER");
			} else {
				$N.app.ContextHelper.openContext("AGORA");
			}
			handled = true;
			break;
		case keys.KEY_RADIO:
			if ($N.apps.core.ContextManager.getActiveContext()._id !== "MUSIC") {
				if (activeContextID === "MEDIAPLAYER") {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_STOP_PLAYBACK_GO_TO_MUSICA,
						$N.app.PVRUtil.getString("stopRecordingPlaybackTitle"),
						$N.app.PVRUtil.getString("stopRecordingPlaybackMessage"),
						[{
							name: $N.app.DialogueHelper.getString("yes"),
							action: $N.app.constants.YES_OPTION
						}, {
							name: $N.app.DialogueHelper.getString("no"),
							action: $N.app.constants.NO_OPTION
						}],
						navigateToMusic);
				} else {
					$N.app.ContextHelper.openContext("MUSIC", {activationContext: {"activeMode": "musicKey"}});
					handled = true;
				}
			}
			break;
		case keys.KEY_MOSAIC:
			if (activeContextID !== "MOSAIC") {
				if (activeContextID === "MEDIAPLAYER") {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_STOP_PLAYBACK_GO_TO_MOSAIC,
						$N.app.PVRUtil.getString("stopRecordingPlaybackTitle"),
						$N.app.PVRUtil.getString("stopRecordingPlaybackMessage"),
						[{
							name: $N.app.DialogueHelper.getString("yes"),
							action: $N.app.constants.YES_OPTION
						}, {
							name: $N.app.DialogueHelper.getString("no"),
							action: $N.app.constants.NO_OPTION
						}],
						navigateToMosaic);
				} else {
					$N.app.ContextHelper.openContext("MOSAIC", {activationContext: {"activeMode": "normal"}});
					handled = true;
				}
			}
			break;
		case keys.KEY_BACK:
			$N.app.ContextHelper.closeContext();
			handled = true;
			break;
		case keys.KEY_EXIT:
			$N.app.ContextHelper.exitContext();
			handled = true;
			break;
		}
		log("keyHandler", "Exit");
		return handled;
	}

	// main default key handler for the application
	function defaultContextKeyHandler(key) {
		log("defaultContextKeyHandler", "Enter");
		var repeats = false,
			handled = false,
			isKeyUp = $N.app.GeneralUtil.isKeyReleaseEvent(key),
			activeController = $N.apps.core.ContextManager.getActiveController(),
			currentDialog = $N.apps.dialog.DialogManager.getCurrentDialog();

		if (recentKeyPress === key) {
			repeats = true;
		}
		recentKeyPress = key;
		if (isKeyUp) {
			recentKeyPress = null;
		}
		if (currentDialog) { // If a dialog is on screen it should handle the key first
			handled = $N.apps.dialog.DialogManager.keyHandler(key);
		}
		if (!handled && activeController && activeController.keyHandler) {
			handled = activeController.keyHandler(key, repeats);
		}
		if (!key.KEY_RECORD) {
			$N.app.SystemUtil.setAndRefreshStandbyTimer();
		}
		log("defaultContextKeyHandler", "Exit");
		return handled;
	}

	return {
		keyHandler : keyHandler,
		defaultContextKeyHandler: defaultContextKeyHandler
	};

}());
