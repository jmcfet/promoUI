/**
 * Helper class for local Portal Promotions window
 *
 * @class $N.app.SettingsPortalData
 * @author rhill
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SettingsPortalData = (function ($N) {
		var	settingsPortalData = null;
		return {
			initialise: function () {
				//$N.apps.core.Language.adornWithGetString($N.app.SettingsPortalData);
			},

			getSettingsPortalData : function () {
				settingsPortalData = {
					"gridSize": {
						"width" : 2,
						"height" : 3
					},
					"items": [
						{
							"x": 0,
							"y": 0,
							"width": 1,
							"height": 1,
							"data": {
								"href": "../../../customise/resources/images/net/menu_portal_preferencias.png",
								"text": $N.app.SettingsPortalData.getString("portalMenuPreferences"),
								"id" : "portalMenuPreferences"
							}
						},
						{
							"x": 0,
							"y": 1,
							"width": 1,
							"height": 1,
							"data": {
								"href": "../../../customise/resources/images/net/config_01_favoritos.png",
								"text": $N.app.SettingsPortalData.getString("portalMenuFavorites"),
								"id" : "portalMenuFavorites"
							}
						},
						{
							"x": 0,
							"y": 2,
							"width": 1,
							"height": 1,
							"data": {
								"href": "../../../customise/resources/images/net/menu_portal_lembretes.png",
								"text": $N.app.SettingsPortalData.getString("portalMenuReminders"),
								"id" : "portalMenuReminders"
							}
						},
						{
							"x": 1,
							"y": 0,
							"width": 1,
							"height": 1,
							"data": {
								"href": "../../../customise/resources/images/net/menu_portal_compras.png",
								"text": $N.app.SettingsPortalData.getString("portalMenuPurchases"),
								"id" : "portalMenuPurchases"
							}
						},
						{
							"x": 1,
							"y": 1,
							"width": 1,
							"height": 1,
							"data": {
								"href": "../../../customise/resources/images/net/menu_portal_sistema.png",
								"text": $N.app.SettingsPortalData.getString("portalMenuSystem"),
								"id" : "portalMenuSystem"
							}
						}
					]
				};
				return settingsPortalData;
			}
		};
	}($N));

	$N.apps.core.Language.adornWithGetString($N.app.SettingsPortalData);

}($N || {}));