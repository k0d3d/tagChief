(function () {

var app = angular.module('controllers', []);

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
  '$stateParams',
  function(
    $scope,
    $ionicModal,
    $ionicPopup,
    $timeout,
    cordovaServices,
    $cordovaGeolocation,
    $state,
    Messaging,
    $cordovaDevice,
    appBootStrap,
    locationsService,
    $stateParams
    ) {

  $scope.pingMsg = function () {
    Messaging.ping($cordovaDevice.getUUID(), function (d) {
      console.log(d);
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

    $scope.$on('$destroy', function () {
      myPopup.remove();
    });

  };


}]);

app.controller('UploaderCtrl', ['$scope', 'cordovaServices', function ($scope, cordovaServices) {


}]);

app.controller('SplashCtrl', ['$scope', function ($scope) {


}]);

app.controller('LocationCtrl', [
  '$scope',
  'locationsService',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'appBootStrap',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap) {
  // $state.transitionTo($state.current, $stateParams, {
  //     reload: true,
  //     inherit: false,
  //     notify: true
  // });
  $scope.locationQueryParams = {
    loadPerRequest: 20
  };


  $scope.openCheckInModal = function (e, locationId) {
    if (e instanceof Event) {
      e.stopPropagation();
    }
     var confirmPopup = $ionicPopup.confirm({
       title: 'Check In',
       template: 'Are you sure you want to checkin here?'
     });
     confirmPopup.then(function(res) {
       if(res) {
        locationsService.checkIntoLocation(locationId);
         // console.log('You are sure');
       } else {
         // console.log('You are not sure');
       }
     });
  };

  $scope.checkInUser = function (params, isModal) {
    // appBootStrap.modals.checkin.hide();
  };

  $scope.loadLocations = function loadLocations (params) {
    var i = locationsService.geoLocationInit();
    i.then(
      function(position) {
        //load user added / tagged / check-in locations / or load locations wit the users interest
        locationsService.locationProximity($scope.locationQueryParams)
        .then(function(d) {
          console.log(d);
          $scope.locationFeed = d.data;
          $scope.$broadcast('scroll.refreshComplete');
        }, function (err) {
          if (err instanceof Error) {
             if (err.message == 'NoLocationData') {
                // alert('Location not found');
             }
          }
          // alert('other error occured');
          $scope.$broadcast('scroll.refreshComplete');
          console.log(err);
        });
      },
      function(e) {
        $scope.$broadcast('scroll.refreshComplete');
        console.log("Error retrieving position " + e.code + " " + e.message);
      }
    );
  };


  //init
  $scope.loadLocations();

  //if there is a prompt to be launched on entry to this state,
  //launch it..
  if ($stateParams.popoverCheckin === 'CHECKIN') {
    $scope.openCheckInModal(null, $stateParams.locationId);
  }


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