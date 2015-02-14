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
      resolve: {
        geoPosition: function ($q, locationsService) {
            var q = $q.defer();
            var i = locationsService.geoLocationInit();
            i.then(
              function(position) {
                q.resolve(position);
                // $scope.position=position;
                // $scope.base = {
                //   lat: position.latitude,
                //   lon: position.longitude
                // };
              },
              function(e) {
                console.log("Error retrieving position " + e.code + " " + e.message);
              }
            );

            return q.promise;
        }
      }
    })

    .state('app.tc', {
      url: "/tc",
      abstract: true,
      views: {
        'maincontent@' : {
          templateUrl: "templates/app.html",
          controller: 'AppCtrl'
        }
      }
    })


    .state('app.tc.home', {
      url: "/home",
      views: {
        'viewContent@app.tc' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      }
    })
    .state('app.tc.locations', {
      url: "/locations",
      views: {
        'viewContent@app.tc' :{
          templateUrl: "templates/locations.html",
          controller: 'LocationCtrl'
        }
      }
    })
    .state('app.tc.location', {
      url: "/location/:locationId",
      views: {
        'viewContent@app.tc' :{
          templateUrl: "templates/location.html"
        }
      }
    })
    .state('app.tc.me', {
      url: "/me/achievements",
      views: {
        'viewContent@app.tc' :{
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
  $urlRouterProvider.otherwise('/app/tc/home');

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
 $httpProvider.interceptors.push(['$q', 'api_config', '$rootScope', function ($q, api_config, $rootScope) {
      return {
          'request': function (config) {
            // appBootStrap.isRequesting = true;
             if (config.url.indexOf('/api/') > -1 ) {
                config.url = api_config.CONSUMER_API_URL + '' + config.url;
                return config || $q.when(config);
              } else {
               return config || $q.when(config);
              }


          },
          'response': function (resp) {
              // appBootStrap.isRequesting = false;
               return resp || $q.when(resp);
          }

      };
  }]);

});


app.run(['$ionicPlatform', '$cordovaPush', 'appBootStrap', function($ionicPlatform, $cordovaPush, appBootStrap) {
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

    appBootStrap.strapCordovaDevice();


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
  'appBootStrap',
  '$interval',
  'locationsService',
  '$cordovaGeolocation',
  '$q',
  'geoPosition',
  function (
    $scope,
    $state,
    $rootScope,
    Messaging,
    $cordovaDevice,
    $window,
    appBootStrap,
    $interval,
    locationsService,
    $cordovaGeolocation,
    $q,
    geoPosition
    ) {
  $rootScope.$on('$stateChangeError', function (evt, toState, toParams, fromState, fromParams, error) {
      console.log(error);
      evt.preventDefault();
  });

  $rootScope.$on('$stateChangeStart',
  function(event, toState, toParams, fromState, fromParams){
    // console.log(toParams);
    if ($window.localStorage.authorizationToken && toState.name.indexOf("app.auth") > -1 ) {
      event.preventDefault();
    }
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
    $state.go('app.auth.welcome');
  }

  $scope.isRequesting = appBootStrap.isRequesting || false;

  // $interval(function () {
  //   if ($window.localStorage.authorizationToken) {
  //     var l = locationsService.getMyLocation() || {};
  //     if (!l.latitude && !l.longitude) {
  //       return false;
  //     }
  //     locationsService.pingUserLocation(l);
  //   }
  // }, 10000);


  /**  Start Geo postioning code / monitor */
  $scope.whoiswhere = [];
  $scope.base = {
    lat: 0,
    lon: 0
  };

  $scope.position = geoPosition;
  $scope.base = {
    lat: geoPosition.latitude,
    lon: geoPosition.longitude
  };

  // var geoLocationInit =  $cordovaGeolocation.getCurrentPosition(posOptions)
  // var i = geoPosition.geoLocationInit();
  // i.then(
  //   function(position) {
  //     $scope.position=position;
  //     $scope.base = {
  //       lat: position.latitude,
  //       lon: position.longitude
  //     };
  //   },
  //   function(e) {
  //     console.log("Error retrieving position " + e.code + " " + e.message);
  //   }
  // );

  var watch = locationsService.watchPosition();
  watch.then(
    null,
    function(e) {
      // error
      console.log("Error retrieving position " + e.code + " " + e.message);
    },
    function(position) {
      $scope.base = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      locationsService.setMyLocation(position.coords);
  });

  // show on the map
  // you as a  markers, objects should have "lat", "lon", and "name" properties
  $scope.whoiswhere.push = {
    "name": "Here I am",
    "lat": $scope.base.lat,
    "lon": $scope.base.lon
  };


  $scope.$on('$destroy', function (e) {
    watch.clearWatch();
  });

  /** end geo monitor code */


  $scope.$on('app-is-requesting', function (e, data) {
    console.log(data);
  });

  $scope.$on('auth-loginRequired', function(e, rejection) {
    if (!$state.is('app.login')) {
      $state.go('app.auth.login', [], {
        location: true
      });
    }
  });
  $scope.$on('event:auth-logout-complete', function() {
    $state.go('app.tc.home', {}, {reload: true, inherit: false});
  });
  $scope.$on('$destroy', function() {
    appBootStrap.strapCordovaDevice().cancel();
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

  app.directive('tiltbg', ['$timeout', function ($timeout) {
    return {
      compile: function (ele) {
        function resizeIBG () {
            $(".ibg-bg", ele).css({
              width: $(window).outerWidth(),
              height: $(window).outerHeight()
            });
        }
        $(document).ready(function () {
           $(ele).interactive_bg({
             strength: 25,              // Movement Strength when the cursor is moved. The higher, the faster it will reacts to your cursor. The default value is 25.
             scale: 1.5,               // The scale in which the background will be zoomed when hovering. Change this to 1 to stop scaling. The default value is 1.05.
             animationSpeed: "100ms",   // The time it takes for the scale to animate. This accepts CSS3 time function such as "100ms", "2.5s", etc. The default value is "100ms".
             contain: false,             // This option will prevent the scaled object/background from spilling out of its container. Keep this true for interactive background. Set it to false if you want to make an interactive object instead of a background. The default value is true.
             wrapContent: false         // This option let you choose whether you want everything inside to reacts to your cursor, or just the background. Toggle it to true to have every elements inside reacts the same way. The default value is false
           });
        });
        $timeout(resizeIBG());
        $(window).on('resize load orientationchange', resizeIBG);
      }
    };
  }]);