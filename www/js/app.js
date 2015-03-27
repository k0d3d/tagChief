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

app.config(function($stateProvider, $urlRouterProvider, $httpProvider, api_config, $ionicConfigProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true
    })

    .state('app.tc', {
      url: '/tc',
      // abstract: true,
      views: {
        'maincontent@' : {
          templateUrl: 'templates/app.html',
          controller: 'AppCtrl',
          resolve: {
            pageProperties : function () {
              return {
                title: 'tagChief'
              };
            }
          }
        }
      }
    })
    .state('app.tc.home', {
      url: '/home',
      views: {
        'mapContent@app.tc' :{
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl',
          resolve: {
            pageProperties : function () {
              return {
                title: 'My Location'
              };
            }
          }
        }
      }
    })
    .state('app.tc.locations', {
      url: '/locations',
      views: {
        'locationContent@app.tc' :{
          templateUrl: 'templates/locations.html',
          controller: 'LocationCtrl',
          resolve: {
            pageProperties : function () {
              return {
                title: 'Near-by Locations'
              };
            }
          }
        }
      },
    })
    .state('app.tc.location', {
      url: '/locations/:locationId',
      views: {
        'locationContent@app.tc' :{
          templateUrl: 'templates/location.html',
          controller: 'ViewLocationCtrl',
          resolve: {
            pageProperties : function () {
              return {
                title: 'Location Profile'
              };
            }
          }
        }
      }
    })
    .state('app.tc.updates', {
      url: '/updates',
      views: {
        'notificationsContent@app.tc' :{
          templateUrl: 'templates/updates.html',
          controller: 'UpdatesCtrl',
          resolve: {
            pageProperties : function () {
              return {
                title: 'Notifications'
              };
            }
          }
        }
      }
    })
    .state('app.tc.account', {
      url: '/account',
      views: {
        'accountContent' :{
          templateUrl: 'templates/account.html',
          controller: 'AccountCtrl',
          resolve: {
            userData: function (AuthenticationService) {
              return AuthenticationService.getThisUser();
            }
          }
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
            $rootScope.$broadcast('app-is-requesting', true);
             if (config.url.indexOf('/api/') > -1 ) {
                config.url = api_config.CONSUMER_API_URL + '' + config.url;
                return config || $q.when(config);
              } else {
               return config || $q.when(config);
              }
          },
          'response': function (resp) {
              $rootScope.$broadcast('app-is-requesting', false);
              // appBootStrap.isRequesting = false;
               return resp || $q.when(resp);
          },
          // optional method
         'responseError': function(rejection) {
            // do something on error
            $rootScope.$broadcast('app-is-requesting', false);
            return $q.reject(rejection);
          },
          // optional method
         'requestError': function(rejection) {
            // do something on error
            $rootScope.$broadcast('app-is-requesting', false);
            return $q.reject(rejection);
          }

      };
  }]);

  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
});


app.run([
  '$ionicPlatform',
  '$cordovaPush',
  'appBootStrap',
  'api_config',
  'pushConfig',
  function($ionicPlatform, $cordovaPush, appBootStrap, api_config, pushConfig) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }


    appBootStrap.strapCordovaDevice();


    //init db
    appBootStrap.db = new PouchDB('tagchief');
    var remoteCouch = false;
    //register the GCM sender Id for the app
    if (window.localStorage.gcmid) {
      $cordovaPush.register(pushConfig);
    }


  });

}]);

app.controller('MainCtrl', [
  '$scope',
  '$state',
  '$stateParams',
  '$window',
  '$rootScope',
  'locationsService',
  '$ionicPopup',
  '$timeout',
  function ($scope, $state, $stateParams, $window, $rootScope, locationsService, $ionicPopup, $timeout) {
      function callForPolls (doc) {
        var t;
        locationsService.pollForFeedback(doc)
        .then(function (rcur) {
          if (!rcur) {
            t = $timeout(function () {
              callForPolls(doc);
            }, 60000);
          } else {
            if (t) t.cancel();
          }
        });
      }
      $scope.mainCfg = {
        viewNoHeaderIsActive: true,
        openCheckInFeedbackModal : function openCheckInFeedbackModal (checkData) {

          $scope._feedback = checkData;

          // An elaborate, custom popup
          var myPopup = $ionicPopup.show({
            templateUrl: 'templates/inc/feedback-popover.html',
            title: 'tagChief Feedback Service',
            // subTitle: 'Adds',
            scope: $scope,
            buttons: [
              {
                text: '<b><i class="fa fa-thumbs-o-down"></i></b>',
                type: 'button-calm',
                onTap: function() {
                  locationsService.updateFeedback($scope._feedback, false);
                }
              },
              {
                text: '<b><i class="fa fa-thumbs-o-up"></i></b>',
                type: 'button-positive',
                onTap: function() {
                  locationsService.updateFeedback($scope._feedback, true);
                }
              }
            ]
          });

          $scope.$on('$destroy', function () {
            myPopup.remove();
          });
        },
        opencheckInPopOver : function (e, location) {
          if (e instanceof Event) {
            e.stopPropagation();
          }
          //fix for notification page trigger or local notification trigger
          location = location.payload || location;
          var locationName = location.locationName || location.name;
          var locationId = location.locationId || location._id;
           var confirmPopup = $ionicPopup.confirm({
             title: 'Check In',
             template: 'Are you sure you want to checkin to ' + locationName + '?'
           });
           confirmPopup.then(function(res) {
             if (res) {

              locationsService.checkIntoLocation(locationId)
              .then(locationsService.writeCheckIntoDB)
              // .then(locationsService.pollForFeedback);
              .then(function (writnDoc) {
                $state.transitionTo('app.tc.location', {
                  locationId: locationId
                }, {
                  notify: true
                });

                callForPolls(writnDoc);
              }, function (err) {
                console.log(err);
              })
              .catch(function (err) {
                console.log(err);
              });
               // console.log('You are sure');
             }
           });
        }
      };

      if (!$window.localStorage.authorizationToken) {
          return $state.transitionTo('app.auth.welcome', $stateParams, { reload: true, inherit: true, notify: true });
      }


      $rootScope.$on('$stateChangeStart',
      function(event, toState){
        //check for an authorizationToken in our localStorage
        //if we find one, we check if it is a Bearer type token,
        //we wanna redirect to our login page to get new auth tokens
        //
        if ($window.localStorage.authorizationToken) {
          //if we have an bearer type auth token and for some reason, we're being sent to any
          //app.auth state... it should freeze d transition.
          if (
            ($window.localStorage.authorizationToken && toState.name.indexOf('app.auth') > -1 ) &&
            ($window.localStorage.authorizationToken.split(' ')[0] === 'Bearer' && toState.name.indexOf('app.auth') > -1 )
          ) {
            console.log('shouldnt b here');
            return event.preventDefault();
          }
        }
      });
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
  '$stateParams',
  '$ionicModal',
  '$ionicPopup',
  'pushConfig',
  '$cordovaPush',
  '$cordovaToast',
  'pageProperties',
  'appUpdates',
  '$ionicPlatform',
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
    $stateParams,
    $ionicModal,
    $ionicPopup,
    pushConfig,
    $cordovaPush,
    $cordovaToast,
    pageProperties,
    appUpdates,
    $ionicPlatform
    ) {
      // if thr no no auth..token in app local storage, treat d user as a first time user
      if (!$window.localStorage.authorizationToken) {
          return $state.transitionTo('app.auth.welcome', $stateParams, { reload: true, inherit: true, notify: true });
      }
      $ionicPlatform.ready(function () {

        $scope.$parent.mainCfg.pageTitle = 'My Location';

        if (!appBootStrap.isBrowser()) {
          cordova.plugins.notification.local.on('click', function (notification) {
            console.log('clicked');
            if (notification.data) {
              Messaging.execAction(JSON.parse(notification.data).eventName, JSON.parse(notification.data));
            }
          });
          cordova.plugins.notification.local.on('schedule', function () {
            console.log('added');
            // console.log(arguments);
          });
          cordova.plugins.notification.local.on('trigger', function (notification) {
            // console.log(arguments);
            var dataObj = JSON.parse(notification.data);
            appUpdates.addUpdate({
              dateTriggered: Date.now(),
              notificationId: notification.id,
              dataObj: dataObj,
              title: notification.title,
              text: notification.text,
              dateScheduled: notification.at
            });
          });
        }


        $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
          switch(notification.event) {
            case 'registered':
              if (notification.regid.length > 0 ) {
                Messaging.setRegId(notification.regid);
                // window.localStorage.gcmid = notification.regid;
                Messaging.ping($cordovaDevice.getUUID(), function (d) {
                  // console.log(d);
                });
              }
              break;

            case 'message':
              // console.log(notification);
              // this is the actual push notification. its format depends on the data model from the push server
              // alert('message = ' + notification.message + ' msgCount = ' + notification.msgcnt);
              Messaging.execAction(notification.payload.execAction, notification.payload);
              break;

            case 'error':
              alert('GCM error = ' + notification.msg);
              break;

            default:
              alert('An unknown GCM event has occurred');
              break;
          }
        });

        $scope.testPing = function () {
          return locationsService.pingUserLocation({shouldPromptCheckIn: true});
        };

        $scope.testCheckIn = function () {
          Messaging.execAction('CHECKIN', {locationId: '54dfde529b18357e313d2aa8', locationName: 'HoneyHome'});
        };

        $scope.testGCM = function () {
          Messaging.testMessaging();
        };
        /**  Start Geo postioning code / monitor */
        $scope.whoiswhere = [];
        $scope.base = {
          coords:  {
            lat: 0,
            lon: 0
          }
        };

        $scope.testLocalNotifications = function testLocalNotifications() {
          appUpdates.testLocalNotification();
        };


        var watch = locationsService.watchPosition();
        watch.then(
          null,
          function(e) {
            // error
            console.log("Error retrieving position " + e.code + " " + e.message);
          },
          function(position) {

            // $scope.base.coords.lat =  position.coords.latitude;
            // $scope.base.coords.lon =  position.coords.longitude;

            locationsService.deviceIsSitting(position.coords);
            locationsService.setMyLocation(position.coords);
        });

        // show on the map
        // you as a  markers, objects should have "lat", "lon", and "name" properties
        $scope.whoiswhere.push = {
          'name': 'Here I am',
          'lat': $scope.base.coords.lat,
          'lon': $scope.base.coords.lon
        };
        /** end geo monitor code */



        //unregister gcm
        // WARNING: dangerous to unregister (results in loss of tokenID)
        $scope.unregisterPush =  function () {
          $cordovaPush.unregister(pushConfig)
          .then(function(result) {
            // Success!
          }, function(err) {
            // Error
          });
        };



        $scope.$on('app-is-requesting', function (e, data) {
          $scope.mainCfg.isRequesting = data;
        });

        $scope.$on('auth-loginRequired', function() {
          if (!$state.is('app.auth.login')) {
            $state.go('app.auth.login', {}, {
              location: true
            });
          }
        });
        $scope.$on('event:auth-logout-complete', function() {
          $scope.$parent.mainCfg.viewNoHeaderIsActive = true;
          $state.go('app.auth.welcome', {}, {reload: true, inherit: false});
        });
        $scope.$on('$destroy', function() {
          watch.clearWatch();
          appBootStrap.strapCordovaDevice().cancel();
        });
        $scope.$on('appUI::checkInPopOver', function (e, data) {
          $scope.$parent.mainCfg.opencheckInPopOver(e, data);
        });
        $scope.$on('appUI::checkInFeedbackModal', function (e, data) {
          if ($state.is('app.tc.updates')) {
            $scope.$parent.mainCfg.openCheckInFeedbackModal(data);
          } else {
            $state.go('app.tc.updates', {reload: true});
          }
        });
        $scope.$on('appEvent::updateSaved', function (e, data) {
          if (!appBootStrap.isBrowser()) {
            $cordovaToast.showShortBottom(data.message);
          }
        });
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
           strength: 35,
           scale: 1.5,
           animationSpeed: '100ms',
           contain: false,
           wrapContent: false
         });
      });
      // $timeout();
      $(window).on('resize load orientationchange', resizeIBG);
      resizeIBG();
    }
  };
}]);

app.directive('vegas', ['$timeout', function ($timeout) {
  return {
    compile: function (ele) {

      $(document).ready(function () {
        $(ele).vegas({
            slides: [
                { src: './img/slider/slider1.jpg' },
                { src: './img/slider/slider2.jpg' },
                { src: './img/slider/slider3.jpg' },
                { src: './img/slider/slider4.jpg' },
                { src: './img/slider/slider5.jpg' }
            ],
            transition: [ 'fade', 'slideRight2'],
            overlay: '/lib/vegas/dist/overlays/02.png',
            timer: false,
            preload: true
        });
      });
      // $timeout();

    }
  };
}]);

app.directive('srctobg', [function () {
  return {
    compile: function (tEle, tAttr) {
      $(tEle).css({
        'background-image': tAttr.src
      });
    }
  };
}]);