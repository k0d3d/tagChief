  var app = angular.module('services');
  app.factory('appUpdates', [
    'Messaging',
    'appBootStrap',
    function (Messaging, appBootStrap) {
    var AU = this;
    AU.updateBank = [];
    return {
      addUpdate: function addUpdate (params) {
        AU.updateBank.push(_.extend({dateAdded: Date.now()}, params));
      },
      getUpdates: function getUpdates () {
        return AU.updateBank;
      },
      testLocalNotification: function testLocalNotification () {
        var now                  = new Date().getTime(),
            seconds_from_now = new Date(now + 5*1000);
        cordova.plugins.notification.local.schedule({
          id:         Date.now(),
          // at:       seconds_from_now,
          text:    'Trial Notice',
          title:      'tagChief Feedback',
          data:       JSON.stringify({'index': 1, 'message': 'Test Notice'}),
          smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png'
        });
      }
    };
  }]);