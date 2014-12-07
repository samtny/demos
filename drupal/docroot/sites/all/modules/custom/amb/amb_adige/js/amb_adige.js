
(function ($) {
  Drupal.behaviors.amb_adige = {
    attach: function (context, settings) {
      $('body').once('amb_adige', function() {
        Drupal.behaviors.amb_adige.createAdigeClient = function () {
          return new $.amb.adige({
            resourceEndpoint: settings.amb_adige.resource_endpoint,
            resourcePort: settings.amb_adige.resource_port,
            resourceSourceName: settings.amb_adige.site_source_name
          }, Drupal.behaviors.amb_persona.createPersonaClient());
        };
      })
    }
  };
}(jQuery));
