// namespace declaration
var $N = window.parent.$N || {};
$N.gui = $N.gui || {};

/**
 *
 * @class ZapperBackgroundBox
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.BackgroundBox
 * @param {Object} docRef (DOM document)
 * @param {Object} parent (DOM parent node)
 */
(function ($N) {
    function ZapperBackgroundBox(docRef, parent) {

        ZapperBackgroundBox.superConstructor.call(this, docRef);

        if (parent) {
            parent.addChild(this);
        }

    }

    $N.gui.Util.extend(ZapperBackgroundBox, $N.gui.BackgroundBox);

    $N.gui = $N.gui || {};
    $N.gui.ZapperBackgroundBox = ZapperBackgroundBox;

}($N || {}));
