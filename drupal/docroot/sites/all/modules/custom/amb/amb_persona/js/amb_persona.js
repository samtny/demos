(function ($) {
  Drupal.behaviors.amb_persona = {
    attach: function (context, settings) {
      $('body').once('amb_persona', function () {
        var persona = new $.amb.persona(null, {});

        (function (persona) {
          Drupal.behaviors.amb_persona.createPersonaClient = function () {
            return persona;
          };
        }(persona));

        var refreshToken = function () {
          // console.log('refreshToken()');

          $.ajax(
              '/amb/persona/ajax/token'
            ).done(function (data) {
              persona.access_token = data.token;
            });

          _.delay(refreshToken, settings.amb_persona.token_refresh_interval);
        };

        refreshToken();
      });
    }
  };
}(jQuery));
