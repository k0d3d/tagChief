// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('tcApp', [
  'ionic',
  'ngCordova',
  'controllers',
  'tcApp.config',
  'services'
  ]);
app.config(function($stateProvider, $urlRouterProvider, $httpProvider, api_config) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      views: {
        'mainContent' : {
          templateUrl: "templates/app.html",
          controller: 'AppCtrl'
        }
      }
    })

    .state('app.home', {
      url: "/home",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/home.html",
          controller: 'FilesCtrl'
        }
      }
    })
    .state('app.locations', {
      url: "/locations",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/locations.html",
          controller: 'FilesCtrl'
        }
      }
    })
    .state('app.location', {
      url: "/location",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/location.html",
          controller: 'FilesCtrl'
        }
      }
    })
    .state('app.me', {
      url: "/me/achievements",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/me-achievements.html",
          controller: 'FilesCtrl'
        }
      }
    })
    .state('app.forgotpw', {
      url: "/auth/forgotpw",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/auth/forgotpw.html",
          controller: 'UploaderCtrl'
        }
      }
    })
    .state('app.register', {
      url: "/auth/register",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/auth/register.html",
          controller: 'UploaderCtrl'
        }
      }
    })
    .state('app.login', {
      url: "/auth/login",
      views: {
        'viewContent@app' :{
          controller: ['$ionicModal', 'appBootStrap', function ($ionicModal, appBootStrap) {
            $ionicModal.fromTemplateUrl('templates/auth/login.html',
              {
                // scope: $scope,
                animation: 'slide-in-up',
                focusFirstInput: true,
                backdropClickToClose: false,
                hardwareBackButtonClose: false
              }
            ).then(function (modal) {
              appBootStrap.activeModal = modal;
              appBootStrap.activeModal.show();
            });
            // appBootStrap.loginModal.show();
          }]
        }
      }
    })
    .state('app.account', {
      url: "/account",
      views: {
        'menuContent' :{
          templateUrl: "templates/account.html",
          // controller: 'PlaylistsCtrl'
        }
      }
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});


app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

app.controller('MainCtrl', ['$scope', function ($scope) {

}]);

app.controller('AppCtrl', ['$scope', function ($scope) {

}]);
