/**
 * The ContextHelper class acts as a wrapper for JSFW Context Manager
 *
 * @class $N.app.ContextHelper
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.ContextManager
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.ContextHelper = (function () {
		var log = new $N.apps.core.Log("Helper", "ContextHelper"),
			contextManager = $N.apps.core.ContextManager;

		return {

			/**
			 * @method openContext
			 * @param {string} contextName
			 * @param {Object} configObject (optional) consisting of...
			 * {Object} activationContext used to pass initial values into the context
			 * {Function} navCompleteCallback to be called once the overlay has been closed
			 * {boolean} [hideUnderlays=false] If set to true, the underlying contexts will be hidden
			 */
			openContext: function (contextName, configObject) {
				log("openContext", "Enter");
				var activationContext = (configObject && configObject.activationContext) ? configObject.activationContext : null,
					navCompleteCallback = (configObject && configObject.navCompleteCallback) ? configObject.navCompleteCallback : null,
					hideUnderlays = (configObject && configObject.hideUnderlays === false) ? false : true,
					defaultContext = contextManager.getDefaultContext();
				if (defaultContext && (contextName === defaultContext.getId())) {
					contextManager.navigateToDefaultContext(activationContext, navCompleteCallback);
				} else if (contextManager.getActiveContext()) {
					contextManager.overlay(contextName, activationContext, navCompleteCallback, hideUnderlays);
				} else {
					contextManager.navigate(contextName, activationContext, navCompleteCallback);
				}
				log("openContext", "Exit");
			},

			/**
			 * @method closeContext
			 */
			closeContext: function () {
				log("closeContext", "Enter");
				contextManager.removeFlaggedContexts();
				if (contextManager.isOverlayActive()) {
					contextManager.popOverlay();
				} else {
					contextManager.navigateToDefaultContext();
				}
				log("closeContext", "Exit");
			},

			/**
			 * @method exitContext
			 * @param {Object} serviceObject (optional)
			 */
			exitContext: function (serviceObject) {
				log("exitContext", "Enter");
				contextManager.removeFlaggedContexts();
				if (contextManager.isPlaybackContextInStack()) {
					contextManager.navigateToPlaybackContext();
				} else {
					contextManager.navigateToDefaultContext(serviceObject);
				}
				log("exitContext", "Exit");
			}
		};
	}());

}($N || {}));