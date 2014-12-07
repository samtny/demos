/**
 * jquery.amas.js
 * Author: Sam Thompson
 * Version: 1.0
 *
 * Asset browser.
 *
 * Dependencies:
 *
 *  -jquery.persona.js
 *     note that at this time we only read the "access_token" property of the persona object.
 *     ... thus it is sufficient to instantiate "$.amb.persona = function() { this.access_token = 'foo'; }" and be done with it...
 *
 * jslint indent: 2
 */

(function ($) {
  "use strict";

  $.amb = $.amb || {};

  $.amb.amas = function (options) {
    var amas = this,
      defaults = {
        endpoint: 'http://dev.amas.amb-api.com/v1/resources',
        request:  {
          query: '',
          resource_types: [],
          start: 0,
          count: 30,
          sort: 'time',
          order: 'asc',
          done: undefined,
          error: undefined
        },
        persona: null
      };

    amas.settings = {};

    amas.search = function (request) {
      var query = $.extend({}, defaults.request, request),
        url = amas.settings.endpoint;

      for (var i = 0; i < query.resource_types.length; i++) {
        url = url + (i === 0 ? '/' + query.resource_types[i] : ',' + query.resource_types[i]);
      }

      $.ajax({
        url: url,
        data: {
          q: query.query,
          start: query.start,
          count: query.count,
          sort: query.sort,
          order: query.order
        },
        headers: {
          Authorization: amas.settings.persona.access_token
        }
      })
        .fail(function (unused, textStatus) {
          if (typeof query.error === 'function') {
            query.error(textStatus);
          }
        })
        .done(function (data, textStatus) {
          if (textStatus == 'success') {
            if (typeof query.done === 'function') {
              query.done(data);
            }
          } else {
            if (typeof query.error === 'function') {
              query.error(textStatus);
            }
          }
        });
    };

    var init = function () {
      amas.settings = $.extend({}, defaults, options);
    };

    init();
  };
}(jQuery));

var amasDummy = {
  search: function (request, callback, total) {
    var resources = [];

    total = total !== undefined ? total : 200000;

    for (var i = 0; i < request.count; i++) {
      resources.push({
        name: request.query + ' ' + (request.start + i),
        amb_id: '12345',
        sequence: request.start + i
      })
    }

    var response = {
      resources: resources,
      search_information: {
        total_items: total,
        start: request.start,
        count: request.count
      }
    };

    (function(callback, response) {
      var callbackDeferred = function() {
        callback(response);
      };

      setTimeout(callbackDeferred, 300);
    }(callback, response));
  }
};
