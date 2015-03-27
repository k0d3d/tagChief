  var app = angular.module('services');
  app.factory('appBootStrap', [
    '$ionicModal',
    '$cordovaDevice',
    '$http',
    'api_config',
    '$q',
    '$window',
    '$ionicPopover',
    '$timeout',
    function ($ionicModal, $cordovaDevice, $http, api_config, $q, $window, $ionicPopover, $timeout) {

    return {
      activeModal: null,
      pendingPrompt: null,
      thisDevice: null,
      isRequesting: false,
      modals: {},
      db: null,
      isBrowser: function () {
        return ionic.Platform.platforms.indexOf("browser") > -1;
      },

      // strapLocalNotifications: function strapLocalNotifications (pluginInstance) {
      //   if (pluginInstance) {
      //     bootHash.localNotificationsInstance = pluginInstance;
      //     return true;
      //   }
      //   return false;
      // },
      // localNotifications: function localNotifications () {
      //   if (!bootHash.localNotificationsInstance) {
      //     if (window.plugin) {
      //       bootHash.localNotificationsInstance = cordova.plugins.notification.local;
      //     }
      //   }
      //   return bootHash.localNotificationsInstance;
      // },
      getDefaultFeedback: function getDefaultFeedback () {
        return [
          {
            question: 'How is the service?',
            promptAfter: '30',
            answer: false
          },
          {
            question: 'Are you having a good time?',
            promptAfter: '60',
            answer: false
          },
          {
            question: 'How is the ambiance?',
            promptAfter: '90',
            answer: false
          }
        ];
      },
      openOnStateChangeSuccess: function openOnStateChangeSuccess (actionName) {
        console.log('should set');
        this.pendingPrompt = actionName;
        console.log(actionName, this.pendingPrompt);
      },
      clearPendingPrompts: function clearPendingPrompts () {
        this.pendingPrompt = null;
        console.log(this.pendingPrompt);
      },
      strapCordovaDevice: function () {
        var self = this;

        return $timeout(function () {
          console.log('strapped');
          self.thisDevice = $cordovaDevice.getDevice();
        });
      },
      tagPopOverinit: function (scope, cb) {
        // .fromTemplateUrl() method
        $ionicPopover.fromTemplateUrl('templates/inc/tag-popover.html', {
          scope: scope,
        }).then(function(popover) {
          cb(popover);
        });
      },
      clientAuthenticationCheck: function (cb) {
        var
            // self = this,
            deviceId = $cordovaDevice.getUUID();
        return $http.get('/api/v1/clients/' + deviceId + '?field_type=device');
        // .success(function (client) {
        //   cb(client);
        // })
        // .error(function (err, status) {
        //   if(status === 404) {
        //     cb (404);
        //   } else {
        //     cb (err);
        //   }

        // });
      },
      clientAuthenticationCreate: function (cb) {
        var
            // self = this,
            deviceName = $cordovaDevice.getModel() || 'Unknown Device',
            deviceId = $cordovaDevice.getUUID();
            return $http.post('/api/v1/clients', {
              name: deviceName,
              deviceId: deviceId
            });
        // .success(function (data) {
        //   cb (data);
        // })
        // .error(function (err) {
        //   console.log(err);
        //   cb(err);
        // });
      },
      clientAuthenticationReset: function () {
        // var self = this,
        var deviceId = $cordovaDevice.getUUID();
        $http.delete('/api/v1/clients/' + deviceId + '?field_type=id')
        .success(function (data) {
          cb (data);
        })
        .error(function (err) {
          console.log(err);
          console.log('device client reg failed');
        });
      },
      clientAuthenticationSave: function () {

      },
      clientOAuth: function(clientId, clientSecret, user) {
        var deferred = $q.defer();
        if(window.cordova) {
          // console.log('cordova');
            var cordovaMetadata = cordova.require("cordova/plugin_list").metadata;
            // console.log(cordovaMetadata);
            if(cordovaMetadata.hasOwnProperty("org.apache.cordova.inappbrowser") === true) {

                var browserRef = window.open(api_config.CONSUMER_API_URL + "/oauth/authorize?client_id=" + clientId + "&redirect_uri=http://localhost/callback&response_type=code&scope=read%20write&email=" +user.email+ "&password=" + user.password, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
                browserRef.addEventListener("loadstart", function(event) {
                    if((event.url).indexOf("http://localhost/callback") === 0) {
                        var requestToken = (event.url).split("code=")[1];
                        $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
                        var authHeaderString = 'Basic ' + btoa(clientId + ':' + clientSecret);
                        delete $http.defaults.headers.common.Authorization;
                        $window.localStorage.authorizationToken  =  authHeaderString;
                        $http({
                          method: "post",
                          url: api_config.CONSUMER_API_URL + "/oauth/token",
                          data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=http://localhost/callback" + "&grant_type=authorization_code" + "&code=" + requestToken ,
                          // headers: {
                          //   "Authorization" : authHeaderString
                          // }
                        })
                            .success(function(data) {
                                $window.localStorage.authorizationToken = 'Bearer ' + data.access_token;
                                browserRef.close();
                                deferred.resolve(data);
                            })
                            .error(function() {
                              browserRef.close();
                                deferred.reject('Problem authenticating');
                            })
                            .finally(function() {
                                setTimeout(function() {
                                    browserRef.close();
                                }, 1);
                            });
                    }
                });
                browserRef.addEventListener('exit', function() {
                    deferred.reject('The sign in flow was canceled');
                });
            } else {
                deferred.reject('Could not find InAppBrowser plugin');
            }
        } else {
            deferred.reject('Cannot authenticate via a web browser');
        }
        return deferred.promise;
      }
    };
  }]);