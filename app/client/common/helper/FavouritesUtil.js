/**
 * @class $N.app.FavouritesUtil
 * @author rhill
 * @static
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.FavouritesUtil = (function () {
		/**
		 * function which updates the service list for favorite channels
		 * Used as both callback for the EPG update event from MW
		 * and also as the function call from the settings.
		 * @method refreshChannels
		 * @public
		 * @param {bool} forceRefresh Represents if forceful refresh is required.
		 * @return {bool}
		 */
		function refreshFavoriteChannels(forceRefresh) {
			var favouriteChannels,
				i = 0,
				FAVOURITE_FOLDER_NAME = $N.app.constants.FAVOURITE_FOLDER_NAME,
				activeContext = $N.apps.core.ContextManager.getActiveContext(),
				serviceObj;

			if (!forceRefresh) {
				/*
				 * Favourites List updated is fired only if the method is used as callback for EPG update.
				 * Not for the function call from the Settings to fo
				 */
				$N.apps.util.EventManager.fire("favouritesListUpdated");
			}
			if (activeContext && (activeContext.getId() === "SETTINGS") && $N.apps.core.ContextManager.getActiveController().isFavouritesActive()) {
				/*
				 * If the Settings is active and favourites menu is active, we should not do the refresh until user exits the menu.
				 * This is for the requirement: SETT-FAV-290.
				 */
				return true;
			}
			favouriteChannels = $N.platform.btv.Favourites.getFavouriteChannels(FAVOURITE_FOLDER_NAME);
			for (i = 0; i < favouriteChannels.length; i++) {
				serviceObj = $N.app.epgUtil.getServiceById(favouriteChannels[i].serviceId);
				if (!serviceObj.serviceId) {
					//If the EPG DB cannot return the service object for the change, we should remove it from favourites list.
					favouriteChannels.splice(i, 1);
				} else {
					//We should be updating the favourite list with the new service object
					favouriteChannels[i] = serviceObj;
				}
			}
			$N.platform.btv.Favourites.setFavouriteChannels(FAVOURITE_FOLDER_NAME, favouriteChannels);
			if ((favouriteChannels.length === 0) && ($N.platform.btv.ChannelCategories.getCurrentCategory() === FAVOURITE_FOLDER_NAME)) {
				//When all the services are removed from the favourites list, we should switch the mode to all channels.
				$N.app.FavouritesUtil.setToAllChannels();
			}
			return true;
		}

		// Public
		return {

			initialise: function () {
				$N.platform.btv.EPG.registerRefreshCallback(refreshFavoriteChannels, this);
			},

			toggleFavourites: function () {
				if ($N.platform.btv.ChannelCategories.getCurrentCategory() === $N.app.constants.FAVOURITE_FOLDER_NAME) {
					this.setToAllChannels();
				} else {
					this.setToFavouriteChannels();
				}
				$N.apps.util.EventManager.fire("favouritesToggled");
			},

			setToFavouriteChannels: function () {
				$N.platform.btv.ChannelCategories.setCurrentCategory($N.app.constants.FAVOURITE_FOLDER_NAME);
			},

			setToAllChannels: function () {
				$N.platform.btv.ChannelCategories.resetCurrentCategory();
			},

			launchFavoritesApp: function () {
				$N.app.ContextHelper.openContext("SETTINGS", {activationContext: {"id" : "portalMenuFavorites", "isFromPortal": true}});
				// "isFromPortal": true is required to highlight the favourites option in the settings.
			},

			refreshFavoriteChannels: refreshFavoriteChannels
		};
	}());

}($N || {}));
