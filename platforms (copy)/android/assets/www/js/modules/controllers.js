(function () {

var app = angular.module('controllers', []);

app.controller('HomeCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  '$cordovaGeolocation',
  '$state',
  'Messaging',
  '$cordovaDevice',
  'appBootStrap',
  'locationsService',
  function(
    $scope,
    $ionicModal,
    $ionicPopup,
    $timeout,
    $cordovaGeolocation,
    $state,
    Messaging,
    $cordovaDevice,
    appBootStrap,
    locationsService
    ) {

  $scope.viewParams = {
    isLoadingGmaps: true
  };

  $scope.pingMsg = function () {
    Messaging.ping($cordovaDevice.getUUID(), function (d) {
      console.log(d);
    });
  };

  $scope.tagPopOver = function () {
    $scope.tagInput = {};

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: 'templates/inc/tag-popover.html',
      title: 'Tag this Location',
      // subTitle: 'Adds',
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
                noName: 'Please enter a name for this location'
              };
              $timeout(function () {
                $scope.tagInput.errors = null;
              }, 5000);
              e.preventDefault();
            } else {
              locationsService.addLocation($scope.tagInput)
              .then(function () {
                myPopup.close();
              }, function () {
                $scope.tagInput.errors = {
                  badRequest: 'Tagging location failed. Please try again'
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

app.controller('LocationCtrl', [
  '$scope',
  'locationsService',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'appBootStrap',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap) {

  $scope.locationQueryParams = {
    loadPerRequest: 20
  };


  $scope.loadLocations = function loadLocations () {
    var i = locationsService.geoLocationInit();
    i.then(
      function() {
        //load user added / tagged / check-in locations / or load locations wit the users interest
        locationsService.locationProximity($scope.locationQueryParams)
        .then(function(d) {
          $scope.locationFeed = d.data;
          $scope.$broadcast('scroll.refreshComplete');
        }, function (err) {
          if (err instanceof Error) {
             if (err.message === 'NoLocationData') {
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
        console.log('Error retrieving position ' + e.code + ' ' + e.message);
      }
    );
  };


  //init
  $scope.loadLocations();


      $scope.opencheckInPopOver = function (e, location) {
        e.stopPropagation();
        // if (e instanceof Event) {
        // }
        var locationName = location.locationName || location.name;
        var locationId = location.locationId || location._id;
         var confirmPopup = $ionicPopup.confirm({
           title: 'Check In',
           template: 'Are you sure you want to checkin to ' + locationName + '?'
         });
         confirmPopup.then(function(res) {
           if (res) {
            locationsService.writeCheckIntoDB(
              {
                  'deviceId' : 'eb0af84b7417e4e1',
                  'locationId' : '54f208ebbebd6fd54c18fc11',
                  'userId' : '54e1a0ca52e960e92e78759f',
                  'checkInTime' : '2015-03-02T16:15:44.064Z',
                  'questions': appBootStrap.getDefaultFeedback()
              }
            )
            .then(locationsService.pollForFeedback, function (err) {
              console.log(err);
            })
            .catch(function (err) {
              console.log(err);
            });
            // locationsService.checkIntoLocation(location.locationId)
            // .then(locationsService.writeCheckIntoDB)
            // .then(locationsService.pollForFeedback);

            $state.transitionTo('app.tc.location', {
              locationId: locationId
            }, {
              reload: true,
              inherit: true,
              notify: true
            });
             // console.log('You are sure');
           }
         });
      };


  //if there is a prompt to be launched on entry to this state,
  //launch it..
  // if ($stateParams.popoverCheckin === 'CHECKIN') {
  //   $scope.openCheckInModal(null, $stateParams.locationId);
  // }
}]);

app.controller('ViewLocationCtrl', [
  '$scope',
  'locationsService',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'appBootStrap',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap) {
    locationsService.fetchLocationData($stateParams.locationId)
    .then(function (viewLocationData) {
      $scope.locationData = viewLocationData.data;
    });
}]);


app.filter('joinlist', function () {
  return function (arr) {
    if (arr) {
      return arr.join(', ');
    } else {
      return '';
    }
  };
});

app.filter('moment', function(){
  return function(time){
    if (time === 'Infinity') {
      return '--';
    } else {
      var m = moment(time);
      return m.fromNow();
    }
  };
})
;

})();