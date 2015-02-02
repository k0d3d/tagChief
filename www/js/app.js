// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('tcApp', [
  'ionic',
  'ngCordova',
  'controllers',
  'tcApp.config',
  'services',
  'GoogleMapsInitializer',
  'auth'
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
          controller: 'HomeCtrl'
        }
      }
    })
    .state('app.locations', {
      url: "/locations",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/locations.html"
          // controller: 'FilesCtrl'
        }
      }
    })
    .state('app.location', {
      url: "/location/:locationId",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/location.html"
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

app.controller('MainCtrl', ['$scope', '$state', function ($scope, $state) {

}]);

app.controller('AppCtrl', ['$scope', '$state', '$rootScope', function ($scope, $state, $rootScope) {
  $rootScope.$on('$stateChangeError', function (evt, toState, toParams, fromState, fromParams, error) {
      console.log(error);
  });
}]);
