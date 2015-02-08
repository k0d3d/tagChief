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

app.controller('HomeCtrl', function($scope, $ionicModal, $timeout, cordovaServices, $cordovaGeolocation, $state, Messaging, $cordovaDevice) {

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


      // var watchOptions = {
      //   frequency : 5000,
      //   timeout : 3000,
      //   enableHighAccuracy: true // may cause errors if true
      // };

      var watch = $cordovaGeolocation.watchPosition(posOptions);
      watch.then(
        null,
        function(err) {
          // error
        },
        function(position) {
          console.log('position changed');
          $scope.basel = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
      });

      // some points of interest to show on the map
      // to be user as markers, objects should have "lat", "lon", and "name" properties
      $scope.whoiswhere.push = {
        "name": "My Marker",
        "lat": $scope.basel.lat,
        "lon": $scope.basel.lon
      };


      $scope.$on('clearGeoWatch', function (e) {
        watch.clearWatch();
      });
    },
    function(e) {
      console.log("Error retrieving position " + e.code + " " + e.message);
    }
  );

  $scope.pingMsg = function () {
    Messaging.ping($cordovaDevice.getUUID(), function (d) {
      console.log(d);
      alert('should be reg');
    });
  };

});

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