(function ($) {
  "use strict";

  $.amb = $.amb || {};

  $.amb.adel = function (options) {
    var adel = this,
      defaults = {
        endpoint: 'http://dev.adel.amb-api.com/adel/resources'
      };

    adel.settings = {};

    adel.resourceUrl = function (amb_id, derivative) {
      return adel.settings.endpoint + '/' + amb_id + (typeof derivative !== 'undefined' ? '/' + derivative : '');
    };

    adel.getResource = function (amb_id) {
      return $.ajax({
        url: adel.resourceUrl(amb_id)
      });
    };

    var init = function () {
      adel.settings = $.extend({}, defaults, options);
    };

    init();
  };

}(jQuery));