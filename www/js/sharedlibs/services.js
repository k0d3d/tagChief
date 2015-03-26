(function () {
  var app = angular.module('services', []);
  app.factory('appUpdates', [
    'Messaging',
    'appBootStrap',
    function (Messaging, appBootStrap) {
    var AU = this;
    AU.updateBank = [];
    return {
      addUpdate: function addUpdate (params) {
        AU.updateBank.push(_.extend({dateAdded: Date.now()}, params));
      },
      getUpdates: function getUpdates () {
        return AU.updateBank;
      },
      testLocalNotification: function testLocalNotification () {
        var now                  = new Date().getTime(),
            seconds_from_now = new Date(now + 5*1000);
        cordova.plugins.notification.local.schedule({
          id:         Date.now(),
          // at:       seconds_from_now,
          text:    'Trial Notice',
          title:      'tagChief Feedback',
          data:       JSON.stringify({'index': 1, 'message': 'Test Notice'}),
          smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png'
        });
      }
    };
  }]);
  app.factory('Messaging', [
    '$http',
    'api_config',
    '$state',
    'appBootStrap',
    '$rootScope',
    '$cordovaPush',
    'pushConfig',
    function ($http, api_config, $state, appBootStrap, $rootScope, $cordovaPush, pushConfig) {

    return {
      prepPushRequest: function (cb) {
        console.log('trying to register push');
        if (!this.getRegId().length) {
          $cordovaPush.register(pushConfig);
        }
        $http.defaults.headers.common.GCMId =  this.getRegId();
        cb();
      },
      setRegId: function (regId) {
        console.log('registered and setting id, %n', regId.length);
        window.localStorage.gcmid = regId;
        return true;
      },
      getRegId: function () {
        return window.localStorage.gcmid || '';
      },
      ping: function (deviceId, cb) {
        this.prepPushRequest(function () {

          $http.post('/api/v1/messaging/' + deviceId)
          .success(function (data) {
            cb(data);
          })
          .error(function (err) {
            cb(err);
          });
        });
      },
      execAction: function execAction (actionName, params) {
        switch (actionName) {
          case 'CHECKIN':
          // appBootStrap.openOnStateChangeSuccess(actionName);
          $rootScope.$broadcast('appUI::checkInPopOver', params);
          break;
          case 'CHECKINFEEDBACK':
          $rootScope.$broadcast('appUI::checkInFeedbackModal', params);
          break;
          default:
          break;
        }
      },
      testMessaging: function testMessaging () {
        this.prepPushRequest(function () {
          $http.post('/api/v1/messaging/' + appBootStrap.thisDevice.uuid+ '/test');
        });
      }
    };
  }]);
  app.factory('AuthenticationService', [
    '$rootScope',
    '$http',
    'api_config',
    '$window',
    'appBootStrap',
    function($rootScope, $http, api_config, $window, appBootStrap) {
      var service = {
        register: function (user, cb) {
          $http({
            method: 'POST',
            url: '/api/v1/users',
            data: {
            // $http.post(api_config.CONSUMER_API_URL + '/api/users', {
              email: encodeURI(user.email),
              phoneNumber: user.phoneNumber,
              password: user.password
            }
          })
          .success(function (data, status) {
            cb(data);
          })
          .error(function (data, status) {
            cb(new Error(data.message));
          });
        },
        login: function(user) {
          var authHeaderString = 'Basic ' + btoa(encodeURIComponent(user.email) + ':' + user.password);
          // console.log(atob(authHeaderString));
          $http.defaults.headers.common.Authorization =  authHeaderString;
          $http.post('/api/v1/users/auth', {
          // $http.post(api_config.CONSUMER_API_URL + '/api/v1/users/auth', {
            // email: encodeURI(user.email),
            // password: user.password
            device: appBootStrap.thisDevice.uuid
          })
          .success(function (data, status) {
            $http.defaults.headers.common.Authorization = authHeaderString;  // Step 1

            // Need to inform the http-auth-interceptor that
            // the user has logged in successfully.  To do this, we pass in a function that
            // will configure the request headers with the authorization token so
            // previously failed requests(aka with status == 401) will be resent with the
            // authorization token placed in the header
            // config.headers.Authorization = 'Bearer ' + data.authorizationToken;
            $window.localStorage.authorizationToken = authHeaderString;


            appBootStrap.clientAuthenticationCheck()
            .then(function (isClient) {
              if (isClient.data) {
                appBootStrap.clientOAuth(isClient.data.clientKey, isClient.data.clientSecret, user)
                .then(function (token) {
                  $rootScope.$broadcast('event:auth-loginConfirmed', status);
                });
              } else {
                appBootStrap.clientAuthenticationCreate()
                .then (function (client) {
                  appBootStrap.clientOAuth(client.data.clientKey, client.data.clientSecret, user)
                  .then(function (token) {
                    $rootScope.$broadcast('event:auth-loginConfirmed', status);
                  });
                });
              }
            });


          })
          .error(function (data, status) {
            $rootScope.$broadcast('event:auth-login-failed', status);
            delete $window.localStorage.authorizationToken;
          });
        },
        logout: function() {
          return $http.delete('/api/v1/users/auth', {})
          .then(function () {
            delete $http.defaults.headers.common.Authorization;
          });
        },
        loginCancelled: function() {
          authService.loginCancelled();
        },
        putUserInfo: function putUserInfo (form) {
          return $http.put('/api/v1/users', form);
        },
        getThisUser: function getThisUser () {
          return $http.get('/api/v1/users');
        }
      };
      return service;
  }]);

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

  app.factory('locationsService', [
    '$http',
    '$cordovaGeolocation',
    '$q',
    '$rootScope',
    'appBootStrap',
    'Messaging',
    '$interpolate',
    'feedback',
    function ($http, $cordovaGeolocation, Q, $rootScope, appBootStrap, Messaging, $interpolate, feedback) {
    var geoSrvs = this;
    geoSrvs.myLocation = {
      longitude : 0,
      latitude: 0,
      timeStamp: null,
      hasCheckedIn: false
    };
    var ls_def_pos_option = {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 1000
    };

    return {
      updateFeedback: function updateFeedback (params) {
        console.log(params);
        return appBootStrap.db.put(params._id);
      },
      pollForFeedback: function pollForFeedback (o) {
        //find checkin record,
        appBootStrap.db.get(o.id)
        .then(function (doc) {
          var now = new Date().getTime(), poll = [];

          for (var i = doc.questions.length - 1; i >= 0; i--) {
            var theQ = doc.questions[i];
            if (!theQ.answer) {
              var seconds_from_now = new Date(now +  theQ.promptAfter * 1000);
              poll.push({
                id:       parseInt('' + now + i),
                at:       seconds_from_now,
                text:     theQ.question,
                title:      'tagChief Feedback',
                smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png',
                data:       JSON.stringify({
                  'index': i,
                  'eventId': o._id,
                  'eventName': 'CHECKINFEEDBACK',
                  'payload':  theQ
                }),
              });
              console.log(parseInt('' + now + i));
            }
          }
          cordova.plugins.notification.local.schedule(poll, function () {
              console.log(arguments);
          });
        });
        //set the timer for when feedback will be asked
        //timer should be cancelled
      },
      writeCheckIntoDB: function writeCheckIntoDB (checkInData) {
        var ct = (_.indexOf(_.keys(feedback), checkInData.data.locationId.category) > -1) ?
                  checkInData.data.locationId.category : 'default';
        var i = {
          locationId: checkInData.data.locationId._id || checkInData.data._id,
          checkInId: checkInData.data._id,
          checkInTime: checkInData.data.checkInTime,
          checkOutTime: null,
          questions: feedback[ct]
        };
        return appBootStrap.db.post(i);
      },
      checkIntoLocation: function checkIntoLocation (locationId) {
        var q = Q.defer(),
            self = this,
            locationData = {};

          locationData.lon = self.getMyLocation().longitude;
          locationData.lat = self.getMyLocation().latitude;
          if (locationData.lon && locationData.lat && locationId) {
            return $http.post('/api/v1/locations/' +  locationId +'?action=CHECKIN', {
              deviceId: appBootStrap.thisDevice.uuid
              // deviceId: 'appBootStrap.thisDevice.getUUID'
            });
          } else {
            q.reject(new Error('NoLocationData'));
            return q.promise;
          }

        return q.promise;
      },
      fetchLocationData: function fetchLocationData (locationId) {
        return $http.get('/api/v1/locations/' + locationId);
      },
      watchPosition: function watchPosition (posOption) {
        posOption = posOption || ls_def_pos_option;
        return $cordovaGeolocation.watchPosition(posOption);
      },
      geoLocationInit: function (posOption) {
          var q = Q.defer(), self = this;
          posOption = posOption || ls_def_pos_option;
          $cordovaGeolocation.getCurrentPosition(posOption)
          .then(function (position) {
            self.setMyLocation(position.coords);
            q.resolve(position.coords);
          }, function (err) {
            q.reject(err);
          });

          return q.promise;
      },
      setMyLocation: function setMyLocation (coords){
        geoSrvs.myLocation.latitude = coords.latitude;
        geoSrvs.myLocation.longitude = coords.longitude;
        if (!geoSrvs.myLocation.timeStamp) {
          geoSrvs.myLocation.timeStamp = Date.now();
        }
      },
      getMyLocation: function getMyLocation () {
        return geoSrvs.myLocation;
      },
      pingUserLocation: function (params) {
        params = params || {};
        var q = Q.defer();


        var self = this;
        $http.defaults.headers.common.GCMId =  Messaging.getRegId();
        $http({
            method: 'POST',
            url: '/api/v1/hereiam',
            data: {
              coords: self.getMyLocation(),
              shouldPromptCheckIn: params.shouldPromptCheckIn,
              deviceId: appBootStrap.thisDevice.uuid
            }
        })
        .then(function (l_data) {
          console.log(l_data);
          if (l_data.data) {
            var seconds_from_now = new Date().getTime();
            //schedule the feedback.
            cordova.plugins.notification.local.schedule({
              id:         seconds_from_now,
              date:       new Date(),
              text:    'You might want to check in',
              title:      $interpolate('You are in {{name}}')(l_data.data),
              smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png',
              // title:      "Hi Chrp",
              data:       JSON.stringify({
                // 'index': i,
                'eventId': seconds_from_now,
                'eventName': 'CHECKIN',
                'payload':  l_data.data
              })
            }, function () {
            });
          } else {
            return q.reject();
          }
          // $rootScope.$broadcast('appUI::checkInPopOver', l_data.);
        });


        return q.promise;
      },
      addLocation: function (locationData) {
        var self = this;
        locationData.lon = self.getMyLocation().longitude;
        locationData.lat = self.getMyLocation().latitude;
        if (locationData.lon && locationData.lat) {
          return $http.post('/api/v1/locations',  JSON.stringify(locationData));
        } else {
          return false;
        }
      },
      listUserLocation: function listUserLocation (query) {
        return $http.get('/api/v1/locations?' + $.param(query));
      },
      // deleteUserLocation: function (locationData) {
      //   return $http.delete('/api/v1/locations/:locationId');
      // },
      locationProximity: function locationProximity () {
        var q = Q.defer(),
            self = this,
            locationData = {};
        console.log('i get called oh');
        // this.geoLocationInit()
        // .then(function (geoPromise) {
        //   console.log(geoPromise);
          locationData.lon = self.getMyLocation().longitude;
          locationData.lat = self.getMyLocation().latitude;
          if (locationData.lon && locationData.lat) {
            return $http.get('/api/v1/position?' + $.param(locationData));
          } else {

            q.reject(new Error('NoLocationData'));
            return q.promise;
          }
        // }, function (err) {
        // });

      },
      deviceIsSitting: function deviceIsSitting (coords) {
        var self = this;
        var prevLocation = self.getMyLocation();
        //if its equal, for how long has it been equal, if its changed..
        //dont bother
        // console.log(geolib.getDistance({
        //   latitude: prevLocation.latitude,
        //   longitude: prevLocation.longitude
        // }, {
        //   latitude: coords.latitude,
        //   longitude: coords.longitude
        // }));
        var latlngds = geolib.getDistance({
          latitude: prevLocation.latitude,
          longitude: prevLocation.longitude
        }, {
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        // console.log(latlngds);
        if (latlngds <= 2 ) {
          var momentNow = moment();
          var momentThen = moment(prevLocation.timeStamp);
          var diff = momentThen.diff(momentNow, 'seconds');
          //for example now is = -57
          //if the user has been in d same location for the below amount of time.
          //and he hasnt checked into this location.
          //trigger a push
          if ((diff > -61 && diff < -54) && !geoSrvs.myLocation.hasCheckedIn) {
            console.log('TRIGGERED');
            $rootScope.$broadcast('locationsService::userisSitting', prevLocation);
            //reset the timeStamp so we can start comparing
            //from here.
            geoSrvs.myLocation.timeStamp = null;
            geoSrvs.myLocation.hasCheckedIn = true;
            self.pingUserLocation({shouldPromptCheckIn: true});

          }
          // console.log('%s has passed since u sat down', diff);
        } else {
          geoSrvs.myLocation.timeStamp = null;
          geoSrvs.myLocation.hasCheckedIn = false;
          // console.log('You are moving u bastard, sit down');
        }
      }
    };
  }]);


})();

