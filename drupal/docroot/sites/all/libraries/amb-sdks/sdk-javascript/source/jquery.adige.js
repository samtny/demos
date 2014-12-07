
;(function($) {
  
  if (!$.amb) { $.amb = {}; }
  
  $.amb.adige = function(options, persona) {
    var adige = this;

    // Public methods

    adige.persona = persona;

    adige.extendResource = function (resource, options) {
      resource = options.attributes !== undefined ? $.extend( resource, options.attributes ) : resource;

      if (options.properties !== undefined) {
        resource.properties = options.properties;
      }

      if (options.related !== undefined) {
        resource.related = options.related;
      }

      return resource;
    };

    adige.extendPayload = function ( resource, options ) {
      var payload = {};

      payload.resource = adige.extendResource( resource, options );

      if (options.process_template !== undefined) {
        payload.process = {
          'with': options.process_template,
          source: {
            name: adige.settings.resourceSourceName
          }
        };

        if (options.file !== undefined) {
          payload.process.originals = [
            { file: options.file }
          ];
        }
      }

      if (options.accessGate !== undefined) {
        payload.gate = options.accessGate;
      }

      return payload;
    };

    adige.createResource = function (resource_type, options) {
      var payload = adige.extendPayload( { resource_type: resource_type }, options );

      if (typeof options.callbacks === 'function') {
        options.callbacks = { 'onDone': options.callbacks };
      }

      $.ajax({
        url: adige.settings.resourceEndpoint,
        type: 'POST',
        headers: {
          Authorization: adige.persona.access_token,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload)
      }).done(function (data) {
        if (options.callbacks && typeof options.callbacks['onDone'] === 'function') {
          options.callbacks['onDone']({
            id: data.response_results.results.resource.amb_id,
            path: data.response_results.results.resource.amb_path
          });
        }
      }).fail(function(data) {
        if (options.callbacks && typeof options.callbacks['onError'] === 'function') {
          options.callbacks['onError']({data: data});
        }
      });
    };

    adige.updateResource = function (amb_id, options) {
      var payload = adige.extendPayload( { amb_id: amb_id }, options );

      if (typeof options.callbacks === 'function') {
        options.callbacks = { 'onDone': options.callbacks };
      }

      return $.ajax({
        url: adige.settings.resourceEndpoint + '/' + amb_id,
        type: 'POST',
        headers: {
          Authorization: adige.persona.access_token,
          'Content-Type': 'application/json'            
        },
        data: JSON.stringify(payload)
      }).done(function (data) {
          if (options.callbacks && typeof options.callbacks['onDone'] === 'function') {
            options.callbacks['onDone']({response: data});
          }
      }).fail(function(data) {
        if (options.callbacks && typeof options.callbacks['onError'] === 'function') {
          options.callbacks['onError']({data: data});
        }
      });
    };

    // Private methods

    var defaults = {
      resourceEndpoint: 'http://dev.adige.amb-api.com/resource',
      resourcePort: 80,
      resourceSourceName: ''
    };

    var initEndpoint = function () {
      if (parseInt(adige.settings.resourcePort) !== 80) {
        var parts = adige.settings.resourceEndpoint.split('//'),
          scheme = parts[0],
          path_components = parts[1].split('/'),
          base_url = path_components[0],
          path = path_components.slice(1, path_components.length),
          endpoint = scheme + '//' + base_url + ':' + adige.settings.resourcePort;

        for (var i = 0; i < path.length; i++) {
          endpoint += '/' + path[i];
        }

        adige.settings.resourceEndpoint = endpoint;
      }
    };

    var init = function () {
      adige.settings = $.extend({}, defaults, options);

      initEndpoint();
    };

    init();
  };

})(jQuery);
