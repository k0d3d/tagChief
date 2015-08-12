(function () {

var app = angular.module('controllers', []);

app.controller('AccountCtrl', [
  'AuthenticationService',
  '$state',
  '$scope',
  '$rootScope',
  '$window',
  'appBootStrap',
  '$cordovaToast',
  '$ionicPopup',
  '$http',
  function (AuthenticationService, $state, $scope, $rootScope, $window, appBootStrap, $cordovaToast, $ionicPopup, $http) {

  $scope.$on('$ionicView.enter', function(){
    $scope.$parent.mainCfg.pageTitle = 'My Account';
  });

  $scope.uiElements = {};
  AuthenticationService.getThisUser()
  .then(function (user){
    $scope.userData  = user.data;
  } );

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
    .then(function() {
      appBootStrap.db.destroy()
      .then(function () {
        delete $http.defaults.headers.common.Authorization;
        delete $window.localStorage.authorizationToken;
        delete $window.localStorage.userId;
        $rootScope.$broadcast('event:auth-logout-complete');
      });
    }, function (err) {
      if (err.status === 401) {
        delete $http.defaults.headers.common.Authorization;
        delete $window.localStorage.authorizationToken;
        delete $window.localStorage.userId;
        $rootScope.$broadcast('event:auth-logout-complete');
      }
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
  '$rootScope',
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
    $cordovaToast,
    $rootScope
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

  $scope.reloadMap = function () {

    $rootScope.$broadcast('appEvent::reloadMap');
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
  '$rootScope',
  function ($scope, locationsService, $state, $stateParams, $ionicPopup, appBootStrap, pageProperties, $rootScope) {
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

  $scope.popCheckIn = function (e, location) {
    event.stopImmediatePropagation();
    if (!$scope.$parent.mainCfg) {
      $rootScope.$broadcast('appUI::checkInPopOver', location);
    } else {
      $scope.$parent.mainCfg.opencheckInPopOver(e, location);
    }
    return false;
  };




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


    $scope.triggerAction = function (i, t) {
      var triggerData = t.dataObj;
      triggerData.dateTriggered = t.dateTriggered;
      triggerData.listIndex = i;
      Messaging.execAction(triggerData.eventName, triggerData);
    };

    $scope.removeItem = function (i) {
      $scope.updatesFeed.splice(i, 1);
    };

    $scope.$on('appEvent::updateSaved', function (e, data) {
      appBootStrap.db.get(data.doc._id)
      .then(function (doc) {
        console.log(doc);
        locationsService.updateCheckIn(doc);
      });
    });

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