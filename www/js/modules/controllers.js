(function () {

var app = angular.module('controllers', []);


app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('splash', {
      url: "/splash",
      abstract: true,
      views: {
        'noHeaderContent' : {
          templateUrl: "full-screen.html",
        }
      }
    })

    .state('splash.welcome', {
      url: "/welcome",
      views: {
        'fullContent@splash' :{
          templateUrl: "templates/splash-first.html",
          controller: 'SplashCtrl'
        }
      }
    });
});

app.controller('FilesCtrl', function($scope, $ionicModal, $timeout, cordovaServices) {

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