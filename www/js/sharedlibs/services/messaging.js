  var app = angular.module('services');
  app.factory('Messaging', [
    '$http',
    'api_config',
    '$state',
    'appBootStrap',
    '$rootScope',
    '$cordovaPush',
    'pushConfig',
    function ($http, api_config, $state, appBootStrap, $rootScope, $cordovaPush, pushConfig) {

    return {
      prepPushRequest: function (cb) {
        console.log('trying to register push');
        if (!this.getRegId().length) {
          $cordovaPush.register(pushConfig);
        }
        $http.defaults.headers.common.GCMId =  this.getRegId();
        cb();
      },
      setRegId: function (regId) {
        console.log('registered and setting id, %n', regId.length);
        window.localStorage.gcmid = regId;
        return true;
      },
      getRegId: function () {
        return window.localStorage.gcmid || '';
      },
      ping: function (deviceId, cb) {
        this.prepPushRequest(function () {

          $http.post('/api/v1/messaging/' + deviceId)
          .success(function (data) {
            cb(data);
          })
          .error(function (err) {
            cb(err);
          });
        });
      },
      execAction: function execAction (actionName, params) {
        switch (actionName) {
          case 'CHECKIN':
          // appBootStrap.openOnStateChangeSuccess(actionName);
          $rootScope.$broadcast('appUI::checkInPopOver', params);
          break;
          case 'CHECKINFEEDBACK':
          $rootScope.$broadcast('appUI::checkInFeedbackModal', params);
          break;
          default:
          break;
        }
      },
      testMessaging: function testMessaging () {
        this.prepPushRequest(function () {
          $http.post('/api/v1/messaging/' + appBootStrap.thisDevice.uuid+ '/test');
        });
      }
    };
  }]);