/**
 * HelperItem Plugin which helps render helper and hook up links
 */
Ext.define('gw.plugin.HelperItem', {
  alias: 'plugin.helperitem',
  extend: 'Ext.AbstractPlugin',

  // ORIGINAL
  /**
   * Shows helper menu next to the helper icon
   */
  showMenu: function () {
    if (this.item && this.item.menu) {
      if (this.item.menu.isHidden()) {
        gw.ext.Util.createAndShowOnDemandMenuIfNeeded(this.item);
        this.item.menu.on('hide', function() {
          // when the menu hides, set the focus back to the item's main element if possible
          if (this && this.el && this.el.focus) {
            // the event loop is just slow enough on IE that the onItemFocus callback doesn't
            // fire fast enough in situations where there is a POC initiated page refresh, so
            // set the focus ID here, first so that it gets restored properly
            gw.app.onFocus(this.el.id);
            this.el.focus();
          }
        }, this.item);
        this.item.menu.showAt(this.item.el.getAnchorXY('bl'));
      }
    } else {
        gw.Debug.log("No menu available for field " + this.id);
    }
  },

  // NEW
  destroy: function () {
    var cmp = this.getCmp();

    if (cmp.item) {
      Ext.destroyMembers(cmp.item, 'menu');
      delete cmp.item.menuOpener;
      delete cmp.item;
    }

    Ext.destroyMembers(cmp,
      'suffix',
      'prefix',
      'beforeSubTpl',
      'afterSubTpl',
      'afterContainer'
    );
  },

  init: function (cmp) {
    var suffix;
    var item;
    var me = this;

    cmp.beforeSubTpl = cmp.prefix;
    cmp.afterSubTpl = cmp.suffix;

    //unbox items
    if (cmp.item) {
      if (cmp.item.length > 0) {
        item = cmp.item[0];
      } else if (cmp.item) {
        item = cmp.item;
      }
    }

    if (item) {
      var alt = '';
      var title = '';
      var iconHeight = '';
      var iconWidth = '';
      if (item.text) {
        suffix = '<span class="g-link-button">' + item.text + '</span>';
      } else {
        if (item.altText) {
          alt = '" alt="' + item.altText;
          title = '" title="' + item.altText;  // tooltip for image
        }
        if (item.iconWidth) {
          iconWidth = '" width="' + item.iconWidth;
          iconHeight = '" height="' + item.iconHeight;
        }
        suffix = '<img src="' + item.icon + iconWidth + iconHeight + alt + title + '">';
      }
      // wrap inside an anchor to allow focusing onto this element:
      suffix = '<a href="javascript:void(0)" id="' + item.id + '" class="' + gw.app.getEventSourceCls() + '">' + suffix + '</a>';

      if (item.menu) { // create menu component
        var menu = item.menu;
        delete item.menu;

        item.menu = gw.ext.Util.getOrCreateFieldMenu(item.id, menu);
        item.menuOpener = this;
      }

      if (cmp.afterSubTpl) {
        cmp.afterSubTpl += suffix;
      } else {
        cmp.afterSubTpl = suffix;
      }

      if (cmp instanceof Ext.form.FieldContainer) {
        cmp.afterContainer = cmp.afterSubTpl;
        cmp.afterSubTpl = null;
      }

      if (Ext.isString(item.handler)) {   // convert string to JS function
        item.ghandler = item.handler;
        item.handler = function () {
          eval(item.ghandler)
        }
      }

      cmp.on('boxready', me.onCmpBoxReady, me, {single: true});
    }
  },

  onCmpBoxReady: function (field) {
    var me = this;
    var item;

    if (field.item[0] !== undefined) {
      field.item = field.item[0];
    }

    item = field.item;
    if (item) {
      item.el = Ext.get(item.id);
      var focusable = false; // if there is a click listener - then focusable
      if (item.menu) { // show menu when the helper icon is clicked
        field.mon(item.el, 'click', me.showMenu, field, {scope: me, stopEvent: true});
        focusable = true;
      } else if (field.item.handler) { // custom handler
        field.mon(item.el, 'click', item.handler, field, {stopEvent: true});
        focusable = true;
      } else if(item.xtype == "gbutton")  {
        focusable = true;
      }

      if (focusable) {
        field.mon(item.el, 'focus', me.onItemFocus, item.el);
        field.mon(item.el, 'blur', me.onItemBlur, item.el);
      }

      if (field.disabled) {
        item.el.setVisible(false)
      }
    }
  },

  onItemFocus : function() {
    var el = this;
    gw.app.onFocus(el.id);
  },

  onItemBlur : function() {
    var el = this;
    gw.app.onBlur(el.id);
  }
});
