(function () {
  var app = angular.module('auth', []);


  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('auth', {
        url: "/auth",
        abstract: true,
        views: {
          'noHeaderContent' : {
            templateUrl: "full-screen.html",
            controller: 'RegisterLoginCtrl'
          }
        }
      })

      .state('auth.welcome', {
        url: "/welcome",
        views: {
          'fullContent@splash' :{
            templateUrl: "templates/splash-first.html",

          }
        }
      })
      .state('auth.forgotpw', {
        url: "/forgotpw",
        views: {
          'fullContent@auth' :{
            templateUrl: "templates/auth/forgotpw.html"
          }
        }
      })
      .state('auth.register', {
        url: "/register",
        views: {
          'fullContent@auth' :{
            templateUrl: "templates/auth/register.html"
          }
        }
      })
      .state('auth.login', {
        url: "/login",
        views: {
          'fullContent@auth' :{
            templateUrl: "templates/auth/login.html"
          }
        }
      })
      ;
  });
  app.controller('RegisterCtrl', ['$scope', function ($scope) {

  }]);
  app.controller('RegisterLoginCtrl', function($scope, $http, $state, AuthenticationService, $ionicPopup, $window, $ionicPlatform, $location, $timeout) {
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
      AuthenticationService.login(form);
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
                    $state.go('auth.login');
                  }
                }
              ]
            });
        }
      });
    };

    $scope.$on('event:auth-loginConfirmed', function() {
      $scope.username = null;
      var url=$location.absUrl() + '#/app/files';
      $timeout(function() {
        $window.location.href=url;
      });
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

  });
  app.controller('LogoutCtrl', function($scope, AuthenticationService, $window) {
      AuthenticationService.logout();
      delete $window.sessionStorage.authorizationToken;
  });
})();