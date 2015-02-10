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

  $httpProvider.interceptors.push('tokenInterceptor');
  $httpProvider.interceptors.push(['$rootScope', '$q', function($rootScope, $q) {
    return {
      responseError: function(response) {
        if (response.status === 403) {
          $rootScope.$broadcast('auth-loginRequired');
        }
        // otherwise, default behaviour
        return $q.reject(response);
      }
    };
  }]);
});


app.run(['$ionicPlatform', '$cordovaPush', function($ionicPlatform, $cordovaPush) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    var pushConfig = {
      "senderID": "384367763163"
    };

    //register the GCM sender Id for the app
    $cordovaPush.register(pushConfig).then(function(result) {
      // Success
      console.log(result);
    }, function(err) {
      // Error
      console.log(err);
    });


    // WARNING: dangerous to unregister (results in loss of tokenID)
    // $cordovaPush.unregister(options).then(function(result) {
    //   // Success!
    // }, function(err) {
    //   // Error
    // });



  });

}]);

app.controller('MainCtrl', ['$scope', '$state', function ($scope, $state) {

}]);

app.controller('AppCtrl', [
  '$scope',
  '$state',
  '$rootScope',
  'Messaging',
  '$cordovaDevice',
  '$window',
  function ($scope, $state, $rootScope, Messaging, $cordovaDevice, $window) {
  $rootScope.$on('$stateChangeError', function (evt, toState, toParams, fromState, fromParams, error) {
      evt.preventDefault();
      console.log(error);
  });

  $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
    switch(notification.event) {
      case 'registered':
        if (notification.regid.length > 0 ) {
          Messaging.setRegId(notification.regid);
          Messaging.ping($cordovaDevice.getUUID(), function (d) {
            console.log(d);
          });
        }
        break;

      case 'message':
        // this is the actual push notification. its format depends on the data model from the push server
        alert('message = ' + notification.message + ' msgCount = ' + notification.msgcnt);
        break;

      case 'error':
        alert('GCM error = ' + notification.msg);
        break;

      default:
        alert('An unknown GCM event has occurred');
        break;
    }
  });

  if (!$window.localStorage.authorizationToken) {
    $state.go('auth.welcome');
  }

  $scope.$on('auth-loginRequired', function(e, rejection) {
    if (!$state.is('app.login')) {
      $state.go('app.login');
    }
  });
  $scope.$on('event:auth-logout-complete', function() {
    $state.go('app.home', {}, {reload: true, inherit: false});
  });
}]);

app.factory('tokenInterceptor', function ($window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.localStorage.authorizationToken) {
        config.headers.Authorization = $window.localStorage.authorizationToken;
      }
      return config;
    }
  };
});