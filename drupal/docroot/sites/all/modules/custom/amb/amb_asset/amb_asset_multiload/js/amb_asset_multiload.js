/**
 * @file
 * Attaches the behaviors for the AMB Asset Multiload element.
 */

(function ($) {
  Drupal.behaviors.amb_asset_multiload = {
    attach: function (context, settings) {
      Drupal.behaviors.amb_asset_multiload.adige = Drupal.behaviors.amb_asset_multiload.adige || Drupal.behaviors.amb_adige.createAdigeClient();

      $('.amb-asset-multiload-element', context).once('amb_asset_multiload', function () {
        var wrapper = this,
          fieldName = _.last($(wrapper).attr('id').match(/.+(field-.+)-und-[0-9]+-multiload/)).replace(/-/g, '_'),
          fieldSettingsAsset = Drupal.settings.amb_asset.field_settings[fieldName],
          fieldSettingsMultiload = Drupal.settings.amb_asset_multiload.field_settings[fieldName];

        wrapper.onAssetsCreated = function(ids) {
          $('.amb-asset-multiload-ids', wrapper).val(ids.join(';'));
          $('.amb-asset-multiload-submit', wrapper).trigger('mousedown');
        };

        wrapper.onCancel = function() {
          $('.multiload-toggle-wrapper', wrapper).hide();
          $('.multiload-toggle', wrapper).show();
        };

        wrapper.toggle = function() {
          $('.multiload-toggle-wrapper', wrapper).show();
          $('.multiload-toggle', wrapper).hide();

          return false;
        };

        $('.multiload-toggle', wrapper).on('click', wrapper.toggle);

        var options = {
          onAssetsCreated: wrapper.onAssetsCreated,
          onCancel: wrapper.onCancel,
          limit: fieldSettingsMultiload.limit,
          processTemplate: fieldSettingsAsset.process_template,
          accessGate: fieldSettingsAsset.access_gate
        },
          parseTarget = function (endpoint, port) {
            if (parseInt(port) !== 80) {
              var parts = endpoint.split('//'),
                scheme = parts[0],
                path_components = parts[1].split('/'),
                base_url = path_components[0],
                path = path_components.slice(1, path_components.length),
                target = scheme + '//' + base_url + ':' + port;

              for (var i = 0; i < path.length; i++) {
                target += '/' + path[i];
              }

              return target;
            }
            else {
              return endpoint;
            }
          },
          resumable = $.amb.binup.binupResumable({
            throttleProgressCallbacks: 0.25,
            maxFiles: fieldSettingsMultiload.limit !== 0 ? fieldSettingsMultiload.limit : undefined,
            target: parseTarget(Drupal.settings.amb_adige.binary_endpoint, Drupal.settings.amb_adige.binary_port)
          }, Drupal.behaviors.amb_persona.createPersonaClient()),
          adige = Drupal.behaviors.amb_adige.createAdigeClient();

        wrapper.multiload = new $.amb.multiload(
          options,
          resumable,
          adige,
          wrapper);
      });
    }
  };
}(jQuery));
