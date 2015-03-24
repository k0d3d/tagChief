(function () {

var app = angular.module('controllers', []);

app.controller('AccountCtrl', [
  'AuthenticationService',
  '$state',
  '$scope',
  '$rootScope',
  '$window',
  'userData',
  'appBootStrap',
  '$cordovaToast',
  '$ionicPopup',
  function (AuthenticationService, $state, $scope, $rootScope, $window, userData, appBootStrap, $cordovaToast, $ionicPopup) {

  $scope.$on('$ionicView.enter', function(){
    $scope.$parent.mainCfg.pageTitle = 'My Account';
  });

  $scope.uiElements = {};
  $scope.userData  = userData;
  $scope.accountPopup = function () {
    $scope.subTitle = '';
    // An elaborate, custom popup
    var accountPopup = $ionicPopup.show({
      templateUrl: 'templates/inc/account-edit.html',
      title: 'Edit Profile',
      subTitle: $scope.subTitle,
      scope: $scope,
      cssClass: 'account-popup animated bounceIn',
      buttons: [
        {
          text: 'Cancel',
          type: 'button-clear',
        },
        {
          text: '<b>Save</b>',
          type: 'button-clear button-assertive yellow-font',
          onTap: function(e) {
            e.preventDefault();
            // if (!$scope.userData.firstname.length || !$scope.userData.lastname.length ) {
            //   $scope.subTitle = 'Please enter a the required fields.';
            // }
            $scope.saveUserProfile($scope.userData);
          }
        }
      ]
    });

    $scope.uiElements.accountPopup = accountPopup;
  };


  $scope.saveUserProfile = function saveUserProfile (form) {
    AuthenticationService.putUserInfo(form)
    .then(function () {
      $scope.uiElements.accountPopup.close();
      //toast for profile updated successfully
      if ($cordovaToast && appBootStrap.isBrowser()) {
        $cordovaToast.showShortBottom('Profile has been updated.');
      }
    }, function () {
      if ($cordovaToast && appBootStrap.isBrowser()) {
        $cordovaToast.showShortBottom('Profile update failed.');
      }
    });
  };

  $scope.doLogout = function () {
    AuthenticationService.logout()
    .then(function () {
      $state.go('app.auth.welcome');
    })
    .finally(function() {
      delete $window.localStorage.authorizationToken;
      delete $window.localStorage.userId;
      $rootScope.$broadcast('event:auth-logout-complete');
    });
  };
}]);

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
  '$cordovaToast',
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
    locationsService,
    $cordovaToast
    ) {

  $scope.$on('$ionicView.enter', function(){
    $scope.$parent.mainCfg.pageTitle = 'My Location';
  });

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
                $cordovaToast.showShortBottom('You have successfully tagged this location');
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
  'pageProperties',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap, pageProperties) {
    $scope.$on('$ionicView.enter', function(){
      $scope.$parent.mainCfg.pageTitle = pageProperties.title;
    });
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


      // $scope.opencheckInPopOver = function (e, location) {
      //   e.stopPropagation();
      //   // if (e instanceof Event) {
      //   // }
      //   var locationName = location.locationName || location.name;
      //   var locationId = location.locationId || location._id;
      //    var confirmPopup = $ionicPopup.confirm({
      //      title: 'Check In',
      //      template: 'Are you sure you want to checkin to ' + locationName + '?'
      //    });
      //    confirmPopup.then(function(res) {
      //      if (res) {
      //       locationsService.writeCheckIntoDB(
      //         {
      //             'deviceId' : 'eb0af84b7417e4e1',
      //             'locationId' : '54f208ebbebd6fd54c18fc11',
      //             'userId' : '54e1a0ca52e960e92e78759f',
      //             'checkInTime' : '2015-03-02T16:15:44.064Z',
      //             'questions': appBootStrap.getDefaultFeedback()
      //         }
      //       )
      //       .then(locationsService.pollForFeedback, function (err) {
      //         console.log(err);
      //       })
      //       .catch(function (err) {
      //         console.log(err);
      //       });
      //       // locationsService.checkIntoLocation(location.locationId)
      //       // .then(locationsService.writeCheckIntoDB)
      //       // .then(locationsService.pollForFeedback);

      //       $state.transitionTo('app.tc.location', {
      //         locationId: locationId
      //       }, {
      //         reload: true,
      //         inherit: true,
      //         notify: true
      //       });
      //        // console.log('You are sure');
      //      }
      //    });
      // };


  //if there is a prompt to be launched on entry to this state,
  //launch it..
  // if ($stateParams.popoverCheckin === 'CHECKIN') {
  //   $scope.openCheckInModal(null, $stateParams.locationId);
  // }
}]);

app.controller('UpdatesCtrl', [
  '$scope',
  'locationsService',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'appBootStrap',
  'pageProperties',
  'appUpdates',
  'Messaging',
  function (
    $scope,
    locationsService,
    $state,
    $stateParams,
    $ionicPopup,
    appBootStrap,
    pageProperties,
    appUpdates,
    Messaging) {

    $scope.$on('$ionicView.enter', function(){
      $scope.$parent.mainCfg.pageTitle = pageProperties.title;
      $scope.updatesFeed = appUpdates.getUpdates();
    });


    $scope.triggerAction = function (actionName, dataParams) {
      Messaging.execAction(actionName, dataParams);
    };

    $scope.refreshUpdates = function () {
      $scope.updatesFeed = appUpdates.getUpdates();
      $scope.$broadcast('scroll.refreshComplete');
    };
}]);
app.controller('ViewLocationCtrl', [
  '$scope',
  'locationsService',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'appBootStrap',
  'pageProperties',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap, pageProperties) {
    $scope.$on('$ionicView.enter', function(){
      $scope.$parent.mainCfg.pageTitle = pageProperties.title;
    });
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
});

app.filter('toStartCase', function () {
  return function (str) {
    return _.startCase(str);
  };
});

app.directive('stretchToBottom', ['$timeout', function ($timeout) {
  return {
    link: function (scope, tEle) {
      function onLoad (e) {
        var
          //get position y
          a = $(tEle).offset().top,
          //get element height
          // b = $(tEle).height(),
          //get height of bottom bar
          c = $('.tabs-bottom .tabs').height(),
          //get window size
          d = $(window).height(),
          //e = subtract a+b+c - d
          e = d - (a + c);
        //use e + b as element height
        $(tEle).height(e + 'px');
      }
      $(window).on('orientationchange resize ready', tEle, onLoad);
      // scope.$on('$ionicView.loaded', function(){
      //   // Any thing you can think of
      //   onLoad();
      // });
      $timeout(onLoad);
    }
  };
}]);

})();