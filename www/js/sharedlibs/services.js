(function () {
  var app = angular.module('services', []);
  app.factory('Messaging', [
    '$http',
    'api_config',
    '$state',
    'appBootStrap',
    '$rootScope',
    function ($http, api_config, $state, appBootStrap, $rootScope) {
      var Messaging = this;
      Messaging.regid = '';


    return {
      setRegId: function (regId) {
        Messaging.regid = regId;
        return true;
      },
      getRegId: function () {
        return Messaging.regid;
      },
      ping: function (deviceId, cb) {
        $http.defaults.headers.common.GCMId =  this.getRegId();
        $http.post('/api/v1/messaging/' + deviceId)
        .success(function (data) {
          cb(data);
        })
        .error(function (err) {
          cb(err);
        });
      },
      execAction: function execAction (actionName, params) {
        switch (actionName) {
          case 'CHECKIN':
          // appBootStrap.openOnStateChangeSuccess(actionName);
          $rootScope.$broadcast('appUI::checkInPopOver', params);
          break;
          default:
          break;
        }
      },
      testMessaging: function testMessaging () {

        return $http.post('/api/v1/messaging/' + appBootStrap.thisDevice.uuid+ '/test');
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
          $http.post('/api/v1/users', {
          // $http.post(api_config.CONSUMER_API_URL + '/api/users', {
            email: encodeURI(user.email),
            phoneNumber: user.phoneNumber,
            password: user.password
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
        logout: function(user) {
          $http.delete('/api/v1/users/auth', {})
          // $http.delete(api_config.CONSUMER_API_URL + '/api/v1/users/auth', {})
          .finally(function(data) {
            delete $http.defaults.headers.common.Authorization;
            delete $window.localStorage.authorizationToken;
            $rootScope.$broadcast('event:auth-logout-complete');
          });
        },
        loginCancelled: function() {
          authService.loginCancelled();
        }
      };
      return service;
  }]);

  app.factory('cordovaServices', ['$window', '$ionicPlatform', function ($window, $ionicPlatform) {
    return {
      filesystem: function (dataPath, cb) {

        var _currentFileSystem = null;

        function fail (fileError) {
          console.log(fileError);
        }

        function directoryReaderSuccess(entries){
            // again, Eclipse doesn't allow object inspection, thus the stringify
            // console.log(JSON.stringify(entries));

            // alphabetically sort the entries based on the entry's name
            entries.sort(function(a,b){return (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);});

            return cb(entries);

            //  start constructing the view
            var list = '<ul>';
            var skip = null;
            for (var i=0;i<entries.length;i++){
              // should we hide "system" files and directories?
              if (true){
                  skip = entries[i].name.indexOf('.') == 0;
              }
              if (!skip){
                list += '<li><div class="rowTitle" data-action="' + (entries[i].isFile ? 'selectFile' : 'beginBrowseForFiles') + '" \
                     data-type="' + (entries[i].isFile ? 'file':'directory') + '" \
                     data-path="' + entries[i].fullPath + '">' + entries[i].name + '</div>\
                     <div class="alginIconInRow"><img src="images/' + (entries[i].isFile ? 'file':'folder') + '.png"></div>\
                     </li>';
              }
            }
          // insert the list into our container
          // document.getElementById('folderName').innerHTML = list + '</ul>';
        }

        // The requestFileSystemSuccess callback now takes the filesystem object
        // and uses it to create a reader which allows us to get all the entries
        // (files and folders) for the given location. On success we will pass
        // our entry array to a function that will sort them, construct an unordered
        // list and then insert them into the app.
        function requestFileSystemSuccess(fileSystem){
          // lets insert the current path into our UI
          // document.getElementById('folderName').innerHTML = fileSystem.root.fullPath;
          // save this location for future use
          _currentFileSystem = fileSystem;
          // create a directory reader
          var directoryReader = fileSystem.root.createReader();
          // Get a list of all the entries in the directory
          directoryReader.readEntries(directoryReaderSuccess,fail);
        }

        $ionicPlatform.ready(function () {
          // get local file system
          // Request File System
          // function beginBrowseForFiles(dataPath){
          if (!dataPath){
            // get the local file system and pass the result to the success callback
            $window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, requestFileSystemSuccess, null);
          } else {
            // this is used to get subdirectories
            // var path = e.target.attributes['data-path'].nodeValue;
            $window.resolveLocalFileSystemURI(
              dataPath,
              function(filesystem){
                // we must pass what the PhoneGap API doc examples call an "entry" to the reader
                // which appears to take the form constructed below.
                requestFileSystemSuccess({root:filesystem});
              },
              function(err){
                // Eclipse doesn't let you inspect objects like Chrome does, thus the stringify
                console.log('### ERR: filesystem.beginBrowseForFiles() -' + (JSON.stringify(err)));
              }
            );
          }
        });


        // }
        // beginBrowseForFiles(dataPath);
      },
      /**
       * returns the file path from
       * @param  {[type]}   uri [description]
       * @param  {Function} cb  [description]
       * @return {[type]}       [description]
       */
      returnFilePathName: function (uri, cb) {
        window.plugins.filenamequery.getFileName(uri, function (data) {
          var i = data.split('/');
          cb({
            fileName: i[i.length -1],
            fullPath: data
          });
        }, function (err) {
          cb(err);
        });
      },
      getFileObject: function (uri, fileMeta, cb) {
        window.resolveLocalFileSystemURL(uri, function (fileEntry) {

          fileEntry.file(function (fileObject) {
            //hack, should always return a file with its real filename and path
            fileObject.name = (ionic.Platform.version() <= 4.3) ? fileObject.name : fileMeta.fileName;
            cb(fileObject);
          }, function (err) {
            console.log('Error creating file object');
          });
        }, function (err) {
          cb(err);
        });
      }
    };
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
      var bootHash = this;
      bootHash.localNotificationsInstance = null;
      bootHash.mockNotificationsInstance = {
        add: function (hash) {
          console.log(hash);
        }
      };
    return {
      activeModal: null,
      pendingPrompt: null,
      thisDevice: null,
      isRequesting: false,
      modals: {},
      db: null,

      strapLocalNotifications: function strapLocalNotifications (pluginInstance) {
        if (pluginInstance) {
          bootHash.localNotificationsInstance = pluginInstance;
          pluginInstance.onadd = function () {
            console.log(arguments);
          };
          return true;
        }
        return false;
      },
      localNotifications: function localNotifications () {
        return bootHash.localNotificationsInstance;
      },
      getDefaultFeedback: function getDefaultFeedback () {
        return [
          {
            question: 'How is the service?',
            promptAfter: '20',
            answer: false
          },
          {
            question: 'Are you having a good time?',
            promptAfter: '20',
            answer: false
          },
          {
            question: 'How is the ambiance?',
            promptAfter: '20',
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
                                deferred.resolve(data);
                            })
                            .error(function() {
                                deferred.reject('Problem authenticating');
                            })
                            .finally(function() {
                                setTimeout(function() {
                                    browserRef.close();
                                }, 10);
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
    function ($http, $cordovaGeolocation, Q, $rootScope, appBootStrap, Messaging) {
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

    geoSrvs.checkInState = {

    }
    return {
      updateFeedback: function updateFeedback (index) {

      },
      pollForFeedback: function pollForFeedback (o) {
        //find checkin record,
        appBootStrap.db.get(o._id)
        .then(function (doc) {
          //check if feedback is required
          for (var i = doc.questions.length - 1; i >= 0; i--) {
            var theQ = doc.questions[i];
            if (!theQ.answer) {
              var now = new Date().getTime(),
                  seconds_from_now = new Date(now +  doc.questions[i].promptAfter * 1000);
              //schedule the feedback.
              appBootStrap.localNotifications.add({
                id:         o._id + '_question_' + i,  // A unique id of the notification
                date:       seconds_from_now,    // This expects a date object
                message:    theQ.question,  // The message that is displayed
                title:      'tagChief Feedback',  // The title of the message
                json:       '{"index": "'+ i +'""}',  // Data to be passed through the notification
                autoCancel: true, // Setting this flag and the notification is automatically cancelled when the user clicks it
              });

            }
          }
        });
        //set the timer for when feedback will be asked
        //timer should be cancelled
      },
      writeCheckIntoDB: function writeCheckIntoDB (checkInData) {

        var i = {
          _id: checkInData._id,
          locationId: checkInData.locationId,
          checkInTime: checkInData.checkInTime,
          checkOutTime: null,
          questions: appBootStrap.getDefaultFeedback()
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
        var self = this;
        $http.defaults.headers.common.GCMId =  Messaging.getRegId();
        return  $http.post('/api/v1/hereiam', {
          coords: self.getMyLocation(),
          shouldPromptCheckIn: params.shouldPromptCheckIn,
          deviceId: appBootStrap.thisDevice.uuid
        });
      },
      addLocation: function (locationData) {
        var self = this;
        locationData.lon = self.getMyLocation().longitude;
        locationData.lat = self.getMyLocation().latitude;
        if (locationData.lon && locationData.lat) {
          return $http.post('/api/v1/locations',  locationData);
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
        if (angular.equals({
          latitude: prevLocation.latitude,
          longitude: prevLocation.longitude
        }, {
          latitude: coords.latitude,
          longitude: coords.longitude
        })) {
          var momentNow = moment();
          var momentThen = moment(prevLocation.timeStamp);
          var diff = momentThen.diff(momentNow, 'seconds');
          //for example now is = -57
          //if the user has been in d same location for the below amount of time.
          //and he hasnt checked into this location.
          //trigger a push
          if ((diff > -60 && diff < -55) && !geoSrvs.myLocation.hasCheckedIn) {
            console.log('TRIGGERED');
            $rootScope.$broadcast('locationsService::userisSitting', prevLocation);
            //reset the timeStamp so we can start comparing
            //from here.
            geoSrvs.myLocation.timeStamp = null;
            geoSrvs.myLocation.hasCheckedIn = true;
            self.pingUserLocation({shouldPromptCheckIn: true});
          }
          console.log('%s has passed since u sat down', diff);
        } else {
          geoSrvs.myLocation.timeStamp = null;
          geoSrvs.myLocation.hasCheckedIn = false;
          console.log('You are moving u bastard, sit down');
        }
      }
    };
  }]);


})();

