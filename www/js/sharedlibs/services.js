(function () {
  var app = angular.module('services', []);
  app.factory('Messaging', ['$http', 'api_config', function ($http, api_config) {
    var regid = '';


    return {
      setRegId: function (regId) {
        this.regid = regId;
        return true;
      },
      getRegId: function () {
        return this.regid;
      },
      ping: function (deviceId, cb) {
        var self = this;
        $http.post('/api/v1/messaging/' + deviceId, {
          rId: self.regid
        })
        .success(function (data) {
          cb(data);
        })
        .error(function (err) {
          cb(err);
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
            device: appBootStrap.thisDevice
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
    return {
      activeModal: null,
      thisDevice: null,
      isRequesting: false,
      strapCordovaDevice: function () {
        var self = this;

        return $timeout(function () {
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
        var self = this,
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
        var self = this,
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
        var self = this,
            deviceId = $cordovaDevice.getUUID();
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
                            .error(function(data, status) {
                                deferred.reject("Problem authenticating");
                            })
                            .finally(function() {
                                setTimeout(function() {
                                    browserRef.close();
                                }, 10);
                            });
                    }
                });
                browserRef.addEventListener('exit', function(event) {
                    deferred.reject("The sign in flow was canceled");
                });
            } else {
                deferred.reject("Could not find InAppBrowser plugin");
            }
        } else {
            deferred.reject("Cannot authenticate via a web browser");
        }
        return deferred.promise;
    }
  };
}]);

app.factory('locationsService', ['$http', '$cordovaGeolocation', '$q', function ($http, $cordovaGeolocation, Q) {
  var geoSrvs = this;
  geoSrvs.myLocation = {
    longitude : 0,
    latitude: 0
  };
  var ls_def_pos_option = {
    timeout: 10000,
    enableHighAccuracy: true,
    maximumAge: 1000
  };
  return {
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
      geoSrvs.myLocation = coords;
    },
    getMyLocation: function getMyLocation () {
      return geoSrvs.myLocation;
    },
    pingUserLocation: function () {
      var self = this;
      return  $http.post('/api/v1/hereiam', {coords: self.getMyLocation()});
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

    }
  };
}]);


})();

