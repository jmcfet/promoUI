/**
 * Provides logic for building the list of categories displayed in the zapper, guide and CatchUp.
 *
 * @class $N.platform.btv.ChannelCategories
 * @singleton
 * @requires $N.platform.btv.Favourites
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.EPG
 */

define('jsfw/platform/btv/ChannelCategories',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/btv/EPG',
		'jsfw/platform/system/Preferences'
	],
	function (Log, EPG, Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.ChannelCategories = (function () {
			var log = new $N.apps.core.Log('btv', 'ChannelCategories'),
				RADIO = 'radioChannels',
				SUBSCRIBED_CHANNELS = 'subscribedChannels',
				ALL_CHANNELS = 'allChannels',
				CURRENT_CATEGORY = 'tv.currentCategory';

			/**
			 * Retrieves the channel category list.
			 *
			 * @method getCategoryList
			 * @return {Array} List of categories, viz., `Subscribed`, `Radio` and `All`. Each element of this list
			 *	is an object with the following attributes:
			 *
			 *		name {String} one of `Radio`, `Subscribed` or `All`
			 *		getChannels {Function} a function returning the list of channels that belong to the category
			 */
			var getCategoryList = function () {
				//TODO: NETUI-2761 / NINJA-1745 removed refresh call as it is unnecessary and slows down list/grid guide entry in NET
				//$N.platform.btv.EPG.refresh(); //always get the latest list of channels before retrieving categories
				var result = [];
				result.unshift({
				    name: RADIO,
				    getChannels: function () {
					    return $N.platform.btv.EPG.getRadioChannels();
				    },
				    getServiceIds: function () {
						return $N.platform.btv.EPG.getRadioServiceIdArraySortedByLCN();
				    }
				});
				result.unshift({
				    name: SUBSCRIBED_CHANNELS,
				    getChannels: function () {
					    return $N.platform.btv.EPG.getSubscribedChannels();
				    },
				    getServiceIds: function () {
						return $N.platform.btv.EPG.getSubscribedServiceIdArraySortedByLCN();
				    }
				});
				result.unshift({
					name: ALL_CHANNELS,
					getChannels: function () {
						return $N.platform.btv.EPG.getAllChannels();
					},
				    getServiceIds: function () {
						return $N.platform.btv.EPG.getServiceIdArraySortedByLCN();
				    }
				});
				return result;
			};

			/**
			 * Retrieves the named category.
			 *
			 * @method getCategoryByName
			 * @param categoryName {String} category that we're interested in
			 * @return {Object} Category object matching the name. See `getCategoryList` for description of the object
			 */
			var getCategoryByName = function (categoryName) {
				var categoryList = getCategoryList(),
					numCategories,
					category,
					retCategory = null,
					i;
				if (categoryName) {
					for (i = 0, numCategories = categoryList.length; i < numCategories; i++) {
						category = categoryList[i];
						if (category && category.name && category.name === categoryName) {
							retCategory = category;
							break;
						}
					}
				}
				return retCategory;
			};

			/**
			 * Retrieves the channels within the named category.
			 *
			 * @method getChannelsFromCategory
			 * @param categoryName {String} category that we're interested in
			 * @return {Array} List of channels in the specified category
			 */
			var getChannelsFromCategory = function (categoryName) {
				var category = getCategoryByName(categoryName),
					channelList = category ? category.getChannels() : [];
				return channelList;
			};

			return {
				/**
				 * Initialises object
				 *
				 * @method initialise
				 * @deprecated Doesn't do anything, provided only for the sake of backward compatibility.
				 */
				initialise: function () {
					var currentCategory = $N.platform.btv.ChannelCategories.getCurrentCategory();
					if (!currentCategory) {
						$N.platform.btv.ChannelCategories.setCurrentCategory(ALL_CHANNELS);
					}
				},
				getCategoryList: getCategoryList,
				getCategoryByName: getCategoryByName,
				getChannelsFromCategory: getChannelsFromCategory,
				/**
				 * Retrieves a list of all channels.
				 *
				 * @method getAllChannels
				 * @return {Array} List of EPGService Objects.
				 */
				getAllChannels: function () {
					return {
						name: ALL_CHANNELS,
						getChannels: $N.platform.btv.EPG.getAllChannels()
					};
				},

				/**
				 * Returns the current category name that the application
				 * should use to render the service list.
				 *
				 * Note: this could be the name of a favourite folder also
				 * @method getCurrentCategory
				 * @return {String} current category
				 */
				getCurrentCategory: function () {
					return $N.platform.system.Preferences.get(CURRENT_CATEGORY);
				},

				/**
				 * Sets the current category name that the application
				 * should use to draw the service list.
				 *
				 * Note: this could be the name of a favourite folder also
				 * @method setCurrentCategory
				 * @param {String} categoryName
				 */
				setCurrentCategory: function (categoryName) {
					$N.platform.system.Preferences.set(CURRENT_CATEGORY, categoryName);
				},

				/**
				 * Resets the current category back to all channels
				 * @method resetCurrentCategory
				 */
				resetCurrentCategory: function () {
					$N.platform.system.Preferences.set(CURRENT_CATEGORY, ALL_CHANNELS);
				}
			};
		}());
		return $N.platform.btv.ChannelCategories;
	}
);