(function () {
  var app = angular.module('auth', []);


  app.config(function($stateProvider) {
    $stateProvider

      .state('app.auth', {
        url: '/auth',
        abstract: true,
        views: {
          'noheadercontent@' : {
            templateUrl: 'templates/full-screen.html',
            controller: 'RegisterLoginCtrl'
          }
        }
      })
      .state('app.auth.forgotpw', {
        url: '/forgotpw',
        views: {
          'fullContent@app.auth' :{
            templateUrl: 'templates/auth/forgotpw.html'
          }
        }
      })
      .state('app.auth.login', {
        url: '/login',
        views: {
          'fullContent@app.auth' :{
            templateUrl: 'templates/auth/login.html'
          }
        }
      })
      .state('app.auth.welcome', {
        url: '/welcome',
        views: {
          'fullContent@app.auth' :{
            templateUrl: 'templates/splash-first.html'
          }
        }
      })
      .state('app.auth.register', {
        url: '/register',
        views: {
          'fullContent@app.auth' :{
            templateUrl: 'templates/auth/register.html'
          }
        }
      })

      ;
  });

  app.controller('RegisterLoginCtrl', [
    '$scope',
    '$http',
    '$state',
    'AuthenticationService',
    '$ionicPopup',
    '$window',
    '$ionicPlatform',
    '$location',
    '$timeout',
    '$rootScope',
    function($scope, $http, $state, AuthenticationService, $ionicPopup, $window, $ionicPlatform, $location, $timeout, $rootScope) {
    // $rootScope.$on('$stateChangeStart',
    // function(event, toState, toParams, fromState, fromParams){

    // });
      // $scope.mainCfg.viewNoHeaderIsActive = true;
    $ionicPlatform.onHardwareBackButton(function () {
      return false;
    });

    $scope.message = "";

    $scope.form = {
      email: "",
      password: "",
      phoneNumber: ""
    };

    $scope.loginBtn = function(form) {
      if (form.email.length == 0 || form.password.length == 0) {
        return false;
      }
      $scope.form.isRequesting = true;
      AuthenticationService.login(form)
      .then(function () {
        $scope.form.isRequesting = false;
      }, function () {
        $scope.form.isRequesting = false;
      });
    };
    $scope.RegisterBtn = function(form) {
      if (form.email.length == 0 || form.password.length == 0 || form.phoneNumber.length == 0) {
        return false;
      }
      AuthenticationService.register(form, function (res) {
        if (res instanceof Error) {
          // An alert dialog
          var alertPopup = $ionicPopup.alert({
           title: 'Oops!',
           template: res.message
          });
          alertPopup.then(function(res) {
            $scope.auth_message = res.message;
          });
        } else {
          $ionicPopup.show({
              template: '<p>We have registered your tagChief account successfully</p>',
              title: 'Welcome',
              buttons: [
                {
                  text: '<b>Login Now</b>',
                  type: 'button-positive',
                  onTap: function(e) {
                    $state.go('app.auth.login');
                  }
                }
              ]
            });
        }
      });
    };

    $scope.goBack = function () {
      $state.go('app.tc.home', [], {
        location: true
      });
    };

    $scope.resetPW = function (form) {
      AuthenticationService.resetPW(form)
      .then(function () {
        // An alert dialog
         $ionicPopup.alert({
         title: 'Successful!',
         template: 'tagChief sent a new password to your email.'
        });

        $scope.form.isRequesting = false;
      }, function () {
        // An alert dialog
        $ionicPopup.alert({
         title: 'Sorry!',
         template: 'tagChief could not reset your password right now. Please try again later.'
        });
      });
    };

    $scope.$on('event:auth-loginConfirmed', function() {
      console.log('login confirmed');
      $scope.$parent.mainCfg.viewNoHeaderIsActive = false;
      $scope.email = $scope.password = '';
      $state.go('app.tc.home', {}, {
        location: true,
        reload: true
      });

      // window.location.reload(true);
    });

    $scope.$on('event:auth-login-failed', function(e, status) {
      var error = "Login failed.";
      if (status == 401) {
        error = "Invalid Username or Password.";
      }
      // An alert dialog
      var alertPopup = $ionicPopup.alert({
       title: 'Sorry!',
       template: error
      });
      alertPopup.then(function(res) {
        $scope.auth_message = error;
      });
    });

  }]);
})();