(function () {
  var app = angular.module('services', []);
  app.factory('AuthenticationService', [
    '$rootScope',
    '$http',
    // 'authService',
    'api_config',
    '$window',
    'appBootStrap',
    function($rootScope, $http, api_config, $window, appBootStrap) {
      var service = {
        register: function (user, cb) {
          $http.post(api_config.CONSUMER_API_URL + '/api/v1/users', {
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
          $http.post(api_config.CONSUMER_API_URL + '/api/v1/users/auth', {
            email: encodeURI(user.email),
            password: user.password
          })
          .success(function (data, status) {
            $http.defaults.headers.common.Authorization = 'Bearer ' + data.authorizationToken;  // Step 1

            // Need to inform the http-auth-interceptor that
            // the user has logged in successfully.  To do this, we pass in a function that
            // will configure the request headers with the authorization token so
            // previously failed requests(aka with status == 401) will be resent with the
            // authorization token placed in the header
            // config.headers.Authorization = 'Bearer ' + data.authorizationToken;
            $window.localStorage.authorizationToken = data.authorizationToken;
            $rootScope.$broadcast('event:auth-loginConfirmed', status);

          })
          .error(function (data, status) {
            $rootScope.$broadcast('event:auth-login-failed', status);
            delete $window.localStorage.authorizationToken;
          });
        },
        logout: function(user) {
          $http.delete(api_config.CONSUMER_API_URL + '/api/v1/users/auth', {})
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
  app.factory('Keeper', ['$http', '$rootScope', 'api_config', function($http, $rootScope, api_config){
      var a = {};

      a.currentFolder = '';

      // a.currentUser = $cookies.throne;

      a.path = [];

      a.addToCrumb = function (ob) {
        a.path.push(ob);
        $rootScope.$broadcast('refresh_breadcrumb');
      };


      /**
       * [thisUserFiles request for files belonging to this user]
       * @param  {[type]}   param
       * @param  {Function} callback
       * @return {[type]}
       */
      a.thisUserFiles = function(param, callback){
        return $http.get(api_config.CONSUMER_API_URL + '/api/v1/users/files', param)
                .then(function(data) {
                  return data;
                }, function (data, status) {
                  return status;
                });
        // .success(function(data, status){
        //     callback(data);
        // })
        // .error(function(data, status){
        //     callback(false);
        // });
      };

      /**
       * [thisUserQueue request for this users uncompleted queue]
       * @param  {[type]}   param
       * @param  {Function} callback
       * @return {[type]}
       */
      a.thisUserQueue = function(param, callback){
        $http.get(api_config + '/api/internal/users/queue', param)
        .success(function(data, status){
            callback(data);
          })
        .error(function(data, status){
            console.log(data);
            callback(false);
          });
      };

      /**
       * [deleteThisFile deletes a file belonging to the user]
       * @param  {[type]}   ixid
       * @param  {Function} callback
       * @return {[type]}
       */
      a.deleteThisFile = function(ixid, callback){
        $http.delete(api_config + '/api/internal/users/files/'+ixid)
        .success(function(data, status){
          callback(data);
        })
        .error(function(data, status){

        });
      };
      /**
       * [deleteThisFolder deletes a folder belonging to the user]
       * @param  {[type]}   folderId
       * @param  {Function} callback
       * @return {[type]}
       */
      a.deleteThisFolder = function(folderId, callback){
        $http.delete(api_config + '/api/internal/users/folder/' + folderId)
        .success(function(data, status){
          callback(data);
        })
        .error(function(data, status){

        });
      };

      /**
       * [removeFromQueue removes an upload from the queue]
       * @param  {[type]}   mid
       * @param  {Function} callback
       * @return {[type]}
       */
      a.removeFromQueue = function(mid, callback){
        $http.delete('/api/internal/users/queue/'+mid)
        .success(function(data, success){
          callback();
        })
        .error(function(data, success) {
            /* Act on the event */
        });
      };

      /**
       * [updateTags updates tags belonging ]
       * @param  {[type]}   tags
       * @param  {Function} cb
       * @return {[type]}
       */
      a.updateTags = function(tags, file_id, cb){
        $http.put('/api/internal/users/files/'+file_id+'/tags', {tags: tags})
        .success(function(d){

        })
        .error(function(d){

        });
      };

      a.search = function(query, cb){
        $http.get('/api/search/'+query)
        .success(function(d){
          cb(d);
        })
        .error(function(err){

        });
      };

      a.makeFolder = function(foldername, parent, cb){

      };

      return a;
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
  app.factory('appBootStrap', ['$ionicModal', function ($ionicModal) {
    return {
      activeModal: null
    };
  }]);

})();

