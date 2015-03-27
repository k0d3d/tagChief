  var app = angular.module('services');
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
