/**
 * @class $N.gui.LibraryOptionsSubMenuIconItem
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenuItem
 */
(function ($N) {

	var LibraryOptionsSubMenuIconItem = function (docRef, parent) {
		LibraryOptionsSubMenuIconItem.superConstructor.call(this, docRef);
		this._secIcon = new $N.gui.Image(docRef, this._container);

		this._title.configure({
			x: this.PADDING + 62,
			width: this._width - (this.PADDING * 2) - 62
		});

		this._secIcon.configure({
			x: this.PADDING,
			y: 12,
			href: "../../../customise/resources/images/%RES/icons/DVR_pasta_menor.png"
		});
	};

	$N.gui.Util.extend(LibraryOptionsSubMenuIconItem, $N.gui.LibraryOptionsSubMenuItem);

	$N.gui.LibraryOptionsSubMenuIconItem = LibraryOptionsSubMenuIconItem;
}(window.parent.$N || {}));