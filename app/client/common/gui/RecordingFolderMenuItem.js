/**
 * RecordingFolderMenuItem is an item Template used for listing
 * folder names with folder icon or any other with tick icon
 * @class $N.gui.RecordingFolderMenuItem
 * @constructor
 * @extends $N.gui.MenuItemIconWithHighlight
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */

(function ($N) {
	function RecordingFolderMenuItem(docRef) {
		RecordingFolderMenuItem.superConstructor.call(this, docRef);

		this.FOLDER_X_POSITION = 63;
		this.TEXT_X_POSITION = 125;

		this._folderIcon = new $N.gui.Image(this._docRef, this._container);
		this._folderIcon.configure({
			x: 63,
			y: 12,
			href: "../../../customise/resources/images/%RES/icons/DVR_pasta_menor.png",
			visible: true
		});
		this._text.configure({
			x: 125
		});
		this._container.setWidth(682);
		this.setDataMapper({
			getTitle: function (obj) {
				return obj.name;
			},
			getIcon: function (obj) {
				return obj.icon;
			},
			getFolderIcon: function (obj) {
				return obj.foldericon;
			}
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		this.addMoveAnimation();
		this.addFadeAnimation();
	}
	$N.gui.Util.extend(RecordingFolderMenuItem, $N.gui.MenuItemIconWithHighlight);

	RecordingFolderMenuItem.prototype.setWidth = function (width) {
		this._container.setWidth(width);
	};

	RecordingFolderMenuItem.prototype.setHighlightWidth = function (width) {
		this._highlight.setWidth(width);
	};

	RecordingFolderMenuItem.prototype.setHighlightOpacity = function (opacity) {
		this._highlight.setOpacity(opacity);
	};

	RecordingFolderMenuItem.prototype.setFolderIconConfiguration = function (obj) {
		this._folderIcon.configure(obj);
	};
	/**
	 * @method update
	 */
	RecordingFolderMenuItem.prototype.update = function (data) {
		RecordingFolderMenuItem.superClass.update.call(this, data);
		if (data) {
			var folderHref = this._dataMapper.getAdditionalIcon(data);
			if (folderHref) {
				if (folderHref === "MOVETEXT") { //for browsing usb data. text needs to move if folder is not there
					this._text.setX(this.FOLDER_X_POSITION);
					folderHref = "";
				} else {
					this._text.setX(this.TEXT_X_POSITION);
				}
				this._folderIcon.setHref(folderHref);
			}
		}
	};
	$N.gui = $N.gui || {};
	$N.gui.RecordingFolderMenuItem = RecordingFolderMenuItem;
}($N || {}));
