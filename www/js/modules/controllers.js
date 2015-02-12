(function () {

var app = angular.module('controllers', []);


// app.config(function($stateProvider, $urlRouterProvider) {
//   $stateProvider

//     .state('splash', {
//       url: "/splash",
//       abstract: true,
//       views: {
//         'noHeaderContent' : {
//           templateUrl: "full-screen.html",
//         }
//       }
//     })

//     .state('splash.welcome', {
//       url: "/welcome",
//       views: {
//         'fullContent@splash' :{
//           templateUrl: "templates/splash-first.html",
//           controller: 'SplashCtrl'
//         }
//       }
//     });
// });

app.controller('HomeCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  'cordovaServices',
  '$cordovaGeolocation',
  '$state',
  'Messaging',
  '$cordovaDevice',
  'appBootStrap',
  'locationsService',
  function($scope, $ionicModal, $ionicPopup, $timeout, cordovaServices, $cordovaGeolocation, $state, Messaging, $cordovaDevice, appBootStrap, locationsService) {

  $scope.whoiswhere = [];
  $scope.basel = {
    lat: 0,
    lon: 0
  };
  var posOptions = {
    timeout: 5000,
    enableHighAccuracy: true,
    maximumAge: 3000
  };

  $cordovaGeolocation.getCurrentPosition(posOptions)
  .then(
    function(position) {
      $scope.position=position;
      var c = position.coords;
      $scope.basel = {
        lat: c.latitude,
        lon: c.longitude
      };
      locationsService.setMyLocation(position.coords);

    },
    function(e) {
      console.log("Error retrieving position " + e.code + " " + e.message);
    }
  );

  var watch = $cordovaGeolocation.watchPosition(posOptions);
  watch.then(
    null,
    function(e) {
      // error
      console.log("Error retrieving position " + e.code + " " + e.message);
    },
    function(position) {
      $scope.basel = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      locationsService.setMyLocation(position.coords);
  });

  // some points of interest to show on the map
  // to be user as markers, objects should have "lat", "lon", and "name" properties
  $scope.whoiswhere.push = {
    "name": "My Marker",
    "lat": $scope.basel.lat,
    "lon": $scope.basel.lon
  };


  $scope.$on('$destroy', function (e) {
    watch.clearWatch();
  });

  $scope.pingMsg = function () {
    Messaging.ping($cordovaDevice.getUUID(), function (d) {
      console.log(d);
      alert('should be reg');
    });
  };

  $scope.tagPopOver = function (e) {
    $scope.tagInput = {};

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: 'templates/inc/tag-popover.html',
      title: 'Tag this Location',
      subTitle: 'Please use normal things',
      scope: $scope,
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: '<b>Tag</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.tagInput.name) {
              //don't allow the user to close unless he enters wifi password
              $scope.tagInput.errors = {
                noName: "Please enter a name for this location"
              };
              $timeout(function () {
                $scope.tagInput.errors = null;
              }, 5000);
              e.preventDefault();
            } else {
              locationsService.addLocation($scope.tagInput)
              .then(function () {
                myPopup.close();
              }, function (err) {
                $scope.tagInput.errors = {
                  badRequest: "Tagging location failed. Please try again"
                };
              }) ;
              // return true;
            }
          }
        }
      ]
    });
    // myPopup.then(function(res) {
    //   if (res) {
    //     myPopup.close();
    //   }
    // });

    $scope.$on('$destroy', function () {
      myPopup.remove();
    });

  };


}]);

app.controller('UploaderCtrl', ['$scope', 'cordovaServices', function ($scope, cordovaServices) {


}]);

app.controller('SplashCtrl', ['$scope', function ($scope) {


}]);

app.filter('hideSystemFiles', function () {
  return function (obj) {
    return (obj.name.indexOf('.') === 0) ? false : true;
  };
});
app.filter('formatFileSize', function(){
  return function(bytes){
    if (typeof bytes !== 'number') {
      return '';
    }
    if (bytes >= 1000000000) {
      return (bytes / 1000000000).toFixed(2) + ' GB';
    }
    if (bytes >= 1000000) {
      return (bytes / 1000000).toFixed(2) + ' MB';
    }
    return (bytes / 1000).toFixed(2) + ' KB';
  };
});
app.filter('moment', function(){
  return function(time){
    if (time == 'Infinity') {
      return '--';
    } else {
      var m = moment(time);
      return m.fromNow();
    }
  };
});
app.filter('fileicon', ['api_config', function (api_config) {
  return function (str) {
    return './img/filetype/' + str.split('/').pop() + '.png';
  };
}])
;

})();