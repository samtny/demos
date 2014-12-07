// jQuery Plugin - AMB Persona
// version 0.0.6, 3 July, 2013
// by Ryan Watkins ryan@ryanwatkins.net

// dependencies:
//  jquery 1.9.1 (COULD REMOVE: only for ajax and instance creation)
//  crypto-js 3.1.2 - hmac-sha256 and enc-base64 (NECESSARY: core encryption routines)
//  moment 2.0.0 (TO REMOVE: only for formatted utc time)

;(function($) {

  if (!$.amb) { $.amb = {}; }; // namespace for other amb components
  $.amb.persona = function(el, options) { // el currently not used

    // plugin default config
    var defaults = {
      apiId: "", // identify app to api. ex. 'fab49822378942ff98f156d22f4195da'
      app: "",   // application we are authenticating against.  ex. 'spa'
      storageKey: "amb.persona", // namespace ex. 'amb.persona' - to store persona data
                                 // app is also added - 'amb.persona.spa.user_id')

      onCreate: function() {},
      onStore: function() {}
      // TODO: more configurable callbacks
      // onChange: function () {}  // change of user/id/token/key - after creating setters
    };

    var persona = this;

    // PUBLIC PROPERTIES

    // these get persisted in localStorage
    persona.user_id = "";      // ex. a913b838adcd45a3812cbc9b020e579f
    persona.user = "";         // ex. knight@americanmediabase.com
    persona.access_token = ""; // ex. ecccad58-d836-40f0-9e60-73abe4615f58

    // these do not get persisted - none yet
    // persona.status = null; // TODO: logged in or not - can be deduced from accessToken

    // PRIVATE PROPERTIES
    var digestAlgorithm = "HMAC-SHA-256";
    var sessionPrivateKey = ""; // private key for this session, once set

    // baseurl + function-url, with token replacement = full url to call
    var api = {
      "baseurl": "http://dev.persona.amb-api.com/v1/identity/apps/%APP%",
      "authenticate":   { "method": "POST", "url": "/authenticate" },
      "create":         { "method": "POST", "url": "/users/create" },
      "update":         { "method": "POST", "url": "/users/update" },
      "changepassword": { "method": "POST", "url": "/users/change_password" },
      "addroles":       { "method": "POST", "url": "/users/roles/add" },
      "droproles":      { "method": "POST", "url": "/users/roles/drop" },
      "delete":         { "method": "POST", "url": "/users/delete" },
      "show":           { "method": "GET",  "url": "/user/%USER_ID%" },

      "session":        { "method": "POST", "url": "/user/session" }
    };

    var init = function() {
      persona.settings = $.extend({}, defaults, options);

      // read from local storage
      $.each(["user_id", "user", "access_token"], function(index, key) {
        var record = window.localStorage.getItem((persona.settings.storageKey + "." + persona.settings.app + "." + key));
        if (record) { persona[key] = record; }
      });

      // setup API urls
      var base = api.baseurl.replace("%APP%", persona.settings.app);
      $.each(api, function(key, value) {
        if ((key !== "baseurl") && value.url) {
          api[key].url = base + value.url;
        }
      });

      window.setTimeout(persona.settings.onCreate, 1);
    }; // init


    // PUBLIC METHODS ////////////////////////////////////////

    // clear auth token from local and storage
    persona.clear = function() {
      $.each(["user_id", "user", "access_token"], function(index, value) {
        window.localStorage.removeItem((persona.settings.storageKey + "." + persona.settings.app + "." + value));
        persona[value] = "";
      });
      sessionPrivateKey = "";
      window.setTimeout(function() { persona.settings.onStore({}); }, 1);
    },

    // call the authenticate api
    persona.authenticate = function(options, successCallback, failureCallback) {
      // use email, if provided
      if (options.user) { persona.user = options.user; }
      var authValue = CryptoJS.enc.Utf8.parse(persona.user + ":" + options.password).toString(CryptoJS.enc.Base64);

      var xhr = createXHR({ action: "authenticate", done: successCallback, fail: failureCallback });
      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          "authentication": "basic", // will always be 'basic' for this api.  and 'digest' for all others
          "value": authValue
        })
      });

      // do not sign request
      $.ajax(request)
        .done(function(data, status, xhr) {
          // TODO: require token in response
          if (data && data.user_id && data.access_token) {
            processAuthenticate(data);
            if (successCallback) { successCallback({ status: status, data: data, xhr: xhr }); }
          } else {
            // console.log('failure - no token or id');
            if (failureCallback) { failureCallback({ status: status, data: data, xhr: xhr  }); }
          }
          return;
        })
        .fail(xhr.fail);
    }; // authenticate

    // call the create user api
    persona.create = function(options, successCallback, failureCallback) {
      var password = CryptoJS.enc.Utf8.parse(options.password).toString(CryptoJS.enc.Base64);
      var xhr = createXHR({ action: "create", done: successCallback, fail: failureCallback });
      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          email: options.email,
          name: options.name,
          display_name: options.display_name || options.name,
          password: password,
          do_authentication: "basic",
          status: "enabled"
        })
      });

      // do not sign request - 'basic'
      $.ajax(request)
        .done(function(data, status, xhr) {
          if (data && data.user_id) {
            if (data.email) { persona.user = data.email; }
            processAuthenticate(data);
            if (successCallback) { successCallback({ status: status, data: data, xhr: xhr }); }
          } else {
            // console.log('failure - no user_id');
            if (failureCallback) { failureCallback({ status: status, data: data, xhr: xhr }); }
          }
          return;
        })
        .fail(xhr.fail);

    }; // create

    // call the update user api
    persona.update = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "update", done: successCallback, fail: failureCallback });
      var data = {
        user_id: options.user_id
      };
      if (options.email)        { data.email        = options.email; }
      if (options.name)         { data.name         = options.name; }
      if (options.display_name) { data.display_name = options.display_name; }
      if (options.old_password) {
        data.old_password = CryptoJS.enc.Utf8.parse(options.old_password).toString(CryptoJS.enc.Base64);
      }
      if (options.new_password) {
        data.new_password = CryptoJS.enc.Utf8.parse(options.new_password).toString(CryptoJS.enc.Base64);
      }

      var request = $.extend(xhr.request, {
        data: JSON.stringify(data)
      });

      // sign request - must be auth'ed
      $.ajax(signRequest(request, persona.access_token))
        .done(function(data, status, xhr) {
          if (data && data.email) {
            // TODO: store email again on update
          }
          return successCallback({ status: status, data: data, xhr: xhr });
        })
        .fail(xhr.fail);
    }; // update

    // TODO: validate admin changing password on users behalf
    persona.changepassword = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "changepassword", done: successCallback, fail: failureCallback });

      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          email: options.email,
          password: CryptoJS.enc.Utf8.parse(options.password).toString(CryptoJS.enc.Base64)
        })
      });

      // sign request - must be auth'ed
      $.ajax(signRequest(request))
        .done(xhr.done)
        .fail(xhr.fail);
    }; // changepassword

    persona.addroles = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "addroles", done: successCallback, fail: failureCallback });
      options.roles = $.isArray(options.roles) ? options.roles : [options.roles];

      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          user_id: options.user_id,
          roles: options.roles
        })
      });
      $.ajax(signRequest(request, persona.access_token))
        .done(xhr.done)
        .fail(xhr.fail);
    };

    persona.droproles = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "droproles", done: successCallback, fail: failureCallback });
      options.roles = $.isArray(options.roles) ? options.roles : [options.roles];

      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          user_id: options.user_id,
          roles: options.roles
        })
      });
      $.ajax(signRequest(request, persona.access_token))
        .done(xhr.done)
        .fail(xhr.fail);
    };

    // call the delete user api
    persona.delete = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "delete", done: successCallback, fail: failureCallback });
      var request = $.extend(xhr.request, {
        data: JSON.stringify({
          user_id: options.user_id
        })
      });

      // sign request - must be auth'ed
      $.ajax(signRequest(request, persona.access_token))
        .done(xhr.done)
        .fail(xhr.fail);
    }; // delete

    persona.show = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "show", done: successCallback, fail: failureCallback });

      var url = api.show.url.replace("%USER_ID%", options.user_id);
      var request = $.extend(xhr.request, {
        url: url,
        data: options.user_id
      });
      // sign request - must be auth'ed
      request = signRequest(request, persona.access_token);
      delete request.data; // we put data in for signing, then remove it

      $.ajax(request)
        .done(xhr.done)
        .fail(xhr.fail);
    }; // show

    persona.session = function(options, successCallback, failureCallback) {
      var xhr = createXHR({ action: "session", done: successCallback, fail: failureCallback });

      // NOTE: temporary url - ignores config
      var request = $.extend(xhr.request, {
        url: "http://ec2-54-224-158-110.compute-1.amazonaws.com:9000/amb/user_session",
        headers: {
          "Authorization": options.token
        }
      });

      $.ajax(request)
        .done(xhr.done)
        .fail(xhr.fail);
    }; // session


    // PRIVATE METHODS ////////////////////////////////////////

    var getNoonce = function() {
      // http://stackoverflow.com/a/2117523/23854
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
        return v.toString(16);
      }); // ex. "d18d3f18-77b3-4df3-bfe5-efceac2ef95d";
    };

    var getDate = function() {
      var now = moment.utc(); // TODO: remove moment dependency
      return {
        full: (now.format("YYYYMMDDTHHmmss") + "Z"),
        ymd: now.format("YYYYMMDD")
      };
    };

    var store = function(options) {
      // store each value in localStorage, namspaced by the key, the app and then the value
      $.each(options, function(key, value) {
        window.localStorage[(persona.settings.storageKey + "." + persona.settings.app + "." + key)] = value;
      });
      window.setTimeout(function() { persona.settings.onStore(options); }, 1);
    };

    // setup a standard request and success / fail handlers
    var createXHR = function(options) {
      return {
        request: {
          type: api[options.action].method,
          url: api[options.action].url,
          contentType: "application/json",
          data: "",
          xhrFields: {
            withCredentials: false
          }
        },
        done: function(data, status, xhr) {
          if (options.done) {
            options.done({ status: status, data: data, xhr: xhr });
          }
          return;
        },
        fail: function(xhr, status, error) {
          var data = {};
          if (xhr.responseText) {
              try {
                data = JSON.parse(xhr.responseText);
              } catch(e) {}
          }
          if (options.fail) {
            options.fail({ status: status, error: error, data: data, xhr: xhr });
          }
          return;
        }
      };
    };

    // sign a request
    var signRequest = function(request, token) {

      var date   = getDate();
      var noonce = getNoonce();

      var personaid = persona.settings.apiId + "/" +
            date.ymd + "/" +
            noonce + "/personaRequest";

      var message = digestAlgorithm + "\n" +
            date.full + "\n" +
            personaid + "\n" +
            persona.settings.apiId;
      if (request.data) {
        message += "\n" + request.data;
      }

      var secret = persona.settings.apiId + sessionPrivateKey;
      var signature = CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Base64);
      var auth_header = ('Persona personaid="' + personaid + '",personasignature="' + signature + '"');
      if (token) {
        auth_header += ",accesstoken=" + token;
      }

      request.headers = $.extend((request.headers || {}), {
        "X-Persona-Digest": digestAlgorithm, // ex. HMAC-SHA-256
        "X-Persona-Date": date.full,         // ex. 20130507T191546Z
        "Authorization": auth_header
      });

      return request;
    };

    var processAuthenticate = function(data) {
      if (data && data.user_id && data.access_token) {
        // store the user info
        persona.user_id = data.user_id;
        persona.access_token = data.access_token;
        // write to local storage
        store({ user: persona.user, user_id: persona.user_id, access_token: (persona.access_token || "") });
        // use returned private key in future requests
        if (data.user_session_key) { sessionPrivateKey = data.user_session_key; }
        return true;
      }
      return false;
    };

    init();
  };

})(jQuery);
